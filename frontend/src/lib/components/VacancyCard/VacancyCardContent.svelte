<script lang="ts">
  import SkillTag from '../ui/SkillTag.svelte';
  import { createEventDispatcher } from 'svelte';
  import { processDescription } from '$lib/utils/sanitize';
  import { preloadData } from '$app/navigation';
  import { browser } from '$app/environment';
  
  export let experience: string | undefined = undefined;
  export let employment: string | undefined = undefined;
  export let skills: string[] = [];
  export let description: string | undefined = undefined;
  export let fullDescription: any = undefined; // DescriptionContent из backend
  export let processedHtml: string | undefined = undefined;
  export let isDetailPage: boolean = false;
  export let isDeleting: boolean = false; // Состояние удаления
  export let vacancyId: string | undefined = undefined; // Добавляем ID для префетча
  export let theme: 'light' | 'dark' = 'dark';
  
  const dispatch = createEventDispatcher<{
    skillClick: string;
    descriptionClick: void;
  }>();
  
  // Парсим fullDescription если это JSON строка
  $: parsedFullDescription = (() => {
    if (!fullDescription) return undefined;
    
    // Если уже объект, возвращаем как есть
    if (typeof fullDescription === 'object') {
      console.log('✅ fullDescription уже объект:', fullDescription);
      return fullDescription;
    }
    
    // Если строка, пытаемся парсить JSON
    if (typeof fullDescription === 'string') {
      try {
        const parsed = JSON.parse(fullDescription);
        console.log('✅ Успешно распарсили fullDescription:', {
          hasRaw: !!parsed.raw,
          hasProcessed: !!parsed.processed,
          hasPreview: !!parsed.preview,
          processedLength: parsed.processed?.length
        });
        return parsed;
      } catch (e) {
        console.error('❌ Failed to parse fullDescription JSON:', e);
        return undefined;
      }
    }
    
    return undefined;
  })();
  
  // Укорачиваем HTML до первых N корневых элементов
  function trimHtmlToFirstBlocks(html: string, maxBlocks: number = 3): string {
    try {
      if (!html || maxBlocks <= 0) return '';
      if (!browser) {
        // SSR-фолбэк: грубо ограничим по блокам через split по <p/ul/ol>
        const matches = html.match(/<\/(p|ul|ol)>/gi) || [];
        if (matches.length === 0) return html;
        let count = 0;
        let endIndex = html.length;
        const regex = /<\/(p|ul|ol)>/gi;
        let m: RegExpExecArray | null;
        while ((m = regex.exec(html)) !== null) {
          count++;
          if (count === maxBlocks) {
            endIndex = m.index + m[0].length;
            break;
          }
        }
        return html.slice(0, endIndex);
      }
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div data-wrap>${html}</div>`, 'text/html');
      const wrap = doc.body.querySelector('[data-wrap]');
      if (!wrap) return html;
      const container = doc.createElement('div');
      let blocksAdded = 0;
      for (const node of Array.from(wrap.childNodes)) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (blocksAdded < maxBlocks) {
            container.appendChild(node.cloneNode(true));
            blocksAdded++;
          } else {
            break;
          }
        } else if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim() ?? '';
          if (text.length > 0 && blocksAdded < maxBlocks) {
            const p = doc.createElement('p');
            p.textContent = text;
            container.appendChild(p);
            blocksAdded++;
          }
        }
        if (blocksAdded >= maxBlocks) break;
      }
      return container.innerHTML || '';
    } catch (e) {
      console.error('[trimHtmlToFirstBlocks] error:', e);
      return html;
    }
  }
  
  // Обработка контента для отображения
  $: displayContent = (() => {
    if (isDetailPage) {
      // Для страницы деталей показываем полный контент
      return parsedFullDescription?.processed || processedHtml || description || '';
    } else {
      // Для карточки в списке: в приоритете короткое описание
      if (description && description.trim().length > 0) {
        // Оборачиваем в параграф для единообразного рендера
        return `<p>${description}</p>`;
      }
      // Если короткого описания нет — показываем ограниченный по блокам HTML
      const sourceHtml = parsedFullDescription?.processed || processedHtml || '';
      const full = processDescription(sourceHtml, 'full');
      const firstBlocks = trimHtmlToFirstBlocks(full, 3);
      return truncateHtmlByChars(firstBlocks, 1200, '');
    }
  })();
  
  $: hasRequirements = experience || employment;
  $: hasSkills = skills && skills.length > 0;
  $: hasRequirementsOrSkills = hasRequirements || hasSkills;
  $: hasDescription = displayContent && displayContent.trim().length > 0;
  
  function handleSkillClick(skill: string) {
    dispatch('skillClick', skill);
  }
  
  // Префетч страницы при наведении для оптимизации
  async function handleDescriptionHover() {
    // Не делаем preload если вакансия удаляется
    if (!isDetailPage && hasDescription && vacancyId && !isDeleting) {
      try {
        await preloadData(`/v/${vacancyId}`);
        console.debug('✅ Prefetched vacancy page:', vacancyId);
      } catch (error) {
        // Игнорируем ошибки префетча - это не критично
        console.debug('❌ Prefetch failed for vacancy:', vacancyId, error);
      }
    }
  }

  function truncateHtmlByChars(html: string, maxChars: number = 1000, readMoreText: string = 'Читать далее'): string {
    try {
      if (!html || maxChars <= 0) return '';
      if (!browser) {
        // Простой SSR-фолбэк: усечение строки HTML
        if (html.length <= maxChars) return html;
        return html.slice(0, maxChars) + '…';
      }
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div data-wrap>${html}</div>`, 'text/html');
      const wrap = doc.body.querySelector('[data-wrap]');
      if (!wrap) return html;
      const outDoc = new DOMParser().parseFromString('<div data-wrap></div>', 'text/html');
      const outRoot = outDoc.body.querySelector('[data-wrap]');
      if (!outRoot) return html;
      let currentLength = 0;
      let truncated = false;
      for (const node of Array.from(wrap.childNodes)) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as Element;
          const nodeHtml = el.outerHTML || '';
          if (currentLength + nodeHtml.length > maxChars) {
            truncated = true;
            break;
          }
          outRoot.appendChild(el.cloneNode(true));
          currentLength += nodeHtml.length;
        } else if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim() ?? '';
          if (currentLength + text.length > maxChars) {
            truncated = true;
            break;
          }
          outRoot.appendChild(node.cloneNode(true));
          currentLength += text.length;
        }
      }
      // Хвост не добавляем здесь — «Читать далее» рендерим отдельной строкой
 
      return outRoot.innerHTML || '';
    } catch (e) {
      console.error('[truncateHtmlByChars] error:', e);
      return html;
    }
  }
</script>

<div class="vacancy-content" class:dark-theme={theme === 'dark'} class:light-theme={theme === 'light'}>
  <!-- Два блока: Требования и Навыки -->
  {#if hasRequirementsOrSkills}
    <div class="requirements-container">
      <!-- Блок 1: Требования (опыт + занятость) -->
      {#if hasRequirements}
        <section class="content-section requirements-section">
          <h3 class="section-title">Требования</h3>
          <div class="requirements-grid">
            {#if experience}
              <div class="requirement-item">
                <span class="requirement-label">Опыт работы:</span>
                <span class="requirement-value">{experience}</span>
              </div>
            {/if}
            
            {#if employment}
              <div class="requirement-item">
                <span class="requirement-label">Тип занятости:</span>
                <span class="requirement-value">{employment}</span>
              </div>
            {/if}
          </div>
        </section>
      {/if}
      
      <!-- Блок 2: Навыки -->
      {#if hasSkills}
        <section class="content-section skills-section">
          <h3 class="section-title">Требуемые навыки</h3>
          <div class="skills-container">
            {#each skills as skill}
              <SkillTag 
                {skill} 
                variant={theme === 'dark' ? 'primary' : 'outline'} 
                size="md" 
                interactive={true}
                onClick={handleSkillClick}
                darkTheme={theme === 'dark'}
              />
            {/each}
          </div>
        </section>
      {/if}
    </div>
  {/if}

  <!-- Описание без лишней вложенности -->
  {#if hasDescription}
    {#if !isDetailPage}
      <a 
        href={vacancyId ? `/v/${vacancyId}` : undefined}
        class="description-container clickable"
        on:mouseenter={handleDescriptionHover}
        aria-label="Нажмите для просмотра полного описания вакансии"
      >
        <div class="description-content">
          {#if displayContent.includes('<')}
            {@html displayContent}
          {:else}
            <p class="description-text">{displayContent}</p>
          {/if}
          <span class="read-more">Читать далее</span>
        </div>
      </a>
    {:else}
      <div 
        id={'vacancy-description'} 
        class="description-container detail-page"
        aria-label={'Описание вакансии'}
      >
        <div class="description-content">
          {#if displayContent.includes('<')}
            {@html displayContent}
          {:else}
            <p class="description-text">{displayContent}</p>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .vacancy-content {
    @apply flex flex-col gap-6 w-full;
    @apply flex-1; /* Растягиваем контент на всю доступную высоту */
  }
  
  /* Контейнер для требований и навыков в строку */
  .requirements-container {
    @apply flex flex-wrap gap-6 w-full;
  }
  
  .content-section {
    @apply relative;
  }
  
  .section-title {
    @apply text-base font-semibold mb-3 m-0;
    /* По умолчанию темная тема */
    @apply text-slate-200;
    
    /* Темный градиент для заголовков секций */
    background: linear-gradient(135deg, theme('colors.slate.200') 0%, theme('colors.slate.300') 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Светлая тема для заголовков секций */
  :global(:not(.dark)) .section-title {
    @apply text-neutral-800;
    background: linear-gradient(135deg, theme('colors.neutral.800') 0%, theme('colors.neutral.600') 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  /* Блок требований (опыт + занятость) - по умолчанию темная тема */
  .requirements-section {
    @apply bg-slate-700 border-slate-600 rounded-lg p-4;
    @apply border-l-4 border-l-purple-400;
    @apply flex-1 min-w-80;
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  /* Светлая тема для блока требований */
  :global(:not(.dark)) .requirements-section {
    @apply bg-neutral-50 border border-neutral-200;
    @apply border-l-4 border-l-primary-500;
    background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }
  
  /* Блок навыков - по умолчанию темная тема */
  .skills-section {
    @apply bg-slate-700 border-slate-600 rounded-lg p-4;
    @apply border-l-4 border-l-blue-400;
    @apply flex-1 min-w-80;
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  /* Светлая тема для блока навыков */
  :global(:not(.dark)) .skills-section {
    @apply bg-neutral-50 border border-neutral-200;
    @apply border-l-4 border-l-success-500;
    background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }
  
  .requirements-grid {
    @apply flex flex-col gap-2;
  }
  
  .requirement-item {
    @apply flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2;
  }
  
  .requirement-label {
    @apply font-medium text-sm;
    @apply sm:min-w-32;
    /* По умолчанию темная тема */
    @apply text-slate-300;
  }

  /* Светлая тема для лейблов */
  :global(:not(.dark)) .requirement-label {
    @apply text-neutral-600;
  }
  
  .requirement-value {
    @apply font-semibold;
    /* По умолчанию темная тема */
    @apply text-slate-100;
  }

  /* Светлая тема для значений */
  :global(:not(.dark)) .requirement-value {
    @apply text-neutral-800;
  }
  
  .skills-container {
    @apply flex flex-wrap gap-2;
  }
  
  /* Описание - по умолчанию темная тема */
  .description-container {
    @apply relative transition-all duration-200 ease-in-out;
    @apply bg-slate-700 border-slate-600 rounded-lg p-4;
    @apply border-l-4 border-l-indigo-400;
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  /* Светлая тема для описания */
  :global(:not(.dark)) .description-container {
    @apply bg-neutral-50 border border-neutral-200;
    @apply border-l-4 border-l-primary-500;
    background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }
  
  .description-container.clickable {
    @apply cursor-pointer;
    /* По умолчанию темная тема */
    @apply focus:outline-2 focus:outline-offset-2 focus:outline-indigo-400;
    @apply hover:border-slate-500 hover:shadow-md;
    transition: all 0.2s ease-in-out;
  }

  /* Светлая тема для кликабельного описания */
  :global(:not(.dark)) .description-container.clickable {
    @apply focus:outline-primary-500;
    @apply hover:border-neutral-300;
  }
  
  .description-container.clickable:hover {
    /* По умолчанию темная тема */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    transform: translateY(-1px);
  }

  /* Светлая тема для hover эффекта */
  :global(:not(.dark)) .description-container.clickable:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  /* Контент описания */
  .description-content {
    @apply w-full;
    /* Убираем все возможные hover эффекты у дочерних элементов */
    pointer-events: none;
  }
  
  .description-content * {
    /* Отключаем интерактивность дочерних элементов */
    pointer-events: none !important;
    /* Убираем возможные фоновые эффекты */
    background-color: transparent !important;
    /* Сбрасываем все transitions */
    transition: none !important;
    transform: none !important;
  }
  
  .description-text {
    @apply leading-relaxed m-0;
    /* По умолчанию темная тема */
    @apply text-slate-200;
    line-height: 1.6;
  }

  /* Отключаем усечение текста на детальной странице */
  .description-container.detail-page .description-text {
    display: block;
    -webkit-line-clamp: unset;
    -webkit-box-orient: initial;
    overflow: visible;
  }

  /* Применяем усечение только на карточках (не detail page) */
  .description-container:not(.detail-page) .description-text {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Светлая тема для текста описания */
  :global(:not(.dark)) .description-text {
    @apply text-neutral-700;
  }
  
  /* Стили для HTML контента - по умолчанию темная тема */
  .description-content :global(p) {
    @apply leading-relaxed m-0;
    @apply mb-2 last:mb-0;
    /* По умолчанию темная тема */
    @apply text-slate-200;
  }

  /* Светлая тема для параграфов */
  :global(:not(.dark)) .description-content :global(p) {
    @apply text-neutral-700;
  }
  
  .description-content :global(h1),
  .description-content :global(h2),
  .description-content :global(h3) {
    @apply font-semibold mb-2 mt-3 first:mt-0;
    @apply text-sm;
    /* По умолчанию темная тема */
    @apply text-slate-100;
  }

  /* Светлая тема для заголовков */
  :global(:not(.dark)) .description-content :global(h1),
  :global(:not(.dark)) .description-content :global(h2),
  :global(:not(.dark)) .description-content :global(h3) {
    @apply text-neutral-800;
  }
  
  .description-content :global(ul),
  .description-content :global(ol) {
    @apply mb-2 last:mb-2 pl-4;
  }
  
  .description-content :global(li) {
    @apply mb-1 last:mb-0;
    @apply text-sm leading-relaxed;
    /* По умолчанию темная тема */
    @apply text-slate-200;
  }

  /* Светлая тема для списков */
  :global(:not(.dark)) .description-content :global(li) {
    @apply text-neutral-700;
  }
  
  .description-content :global(strong),
  .description-content :global(b) {
    @apply font-semibold;
    /* По умолчанию темная тема */
    @apply text-slate-100;
  }

  /* Светлая тема для жирного текста */
  :global(:not(.dark)) .description-content :global(strong),
  :global(:not(.dark)) .description-content :global(b) {
    @apply text-neutral-800;
  }
  
  .description-content :global(em),
  .description-content :global(i) {
    @apply italic;
  }
  
  .description-container:not(.detail-page) .description-content {
    overflow: hidden;
    position: relative;
  }

  /* Строка «Читать далее» в кратком описании */
  .read-more {
    display: block;
    margin-top: 0.25rem;
    color: var(--link-color, #3b82f6);
    font-weight: 600;
  }
  .clickable .read-more:hover {
    text-decoration: underline;
  }
  
  /* Responsive design */
  @media (max-width: 640px) {
    .vacancy-content {
      @apply gap-4;
    }
    
    .requirements-container {
      @apply flex-col gap-4;
    }
    
    .requirements-section,
    .skills-section {
      @apply min-w-0;
    }
    
    .description-container {
      @apply min-w-0;
    }
    
    .description-container.clickable:hover {
      transform: none;
    }
    
    .description-text {
      -webkit-line-clamp: 3;
    }
    
    .description-container:not(.detail-page) .description-content {

    }
    
    .content-section {
      @apply p-3;
    }
    
    .requirements-grid {
      @apply gap-2;
    }
    
    .requirement-item {
      @apply flex-col gap-1;
    }
  }
  
  /* Accessibility */
  @media (prefers-reduced-motion: reduce) {
    .content-section {
      transition: none;
    }
    
    .description-container {
      transition: none;
    }
    
    .description-container.clickable:hover {
      transform: none;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
  }

  /* === ГЛОБАЛЬНАЯ ТЕМНАЯ ТЕМА === */
  :global(.dark) .section-title {
    @apply text-slate-200;
    background: linear-gradient(135deg, theme('colors.slate.200') 0%, theme('colors.slate.300') 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* === ЛОКАЛЬНАЯ ТЕМНАЯ ТЕМА === */
  .vacancy-content.dark-theme .section-title {
    @apply text-slate-200;
    background: linear-gradient(135deg, theme('colors.slate.200') 0%, theme('colors.slate.300') 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* === ЛОКАЛЬНАЯ СВЕТЛАЯ ТЕМА (переопределение глобальной темной) === */
  :global(.dark) .vacancy-content.light-theme .section-title {
    @apply text-neutral-800;
    background: linear-gradient(135deg, theme('colors.neutral.800') 0%, theme('colors.neutral.600') 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Глобальная темная тема для секций */
  :global(.dark) .requirements-section {
    @apply bg-slate-700 border-slate-600;
    @apply border-l-purple-400;
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  :global(.dark) .skills-section {
    @apply bg-slate-700 border-slate-600;
    @apply border-l-blue-400;
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  /* Локальная темная тема для секций */
  .vacancy-content.dark-theme .requirements-section {
    @apply bg-slate-700 border-slate-600;
    @apply border-l-purple-400;
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .vacancy-content.dark-theme .skills-section {
    @apply bg-slate-700 border-slate-600;
    @apply border-l-blue-400;
    background: linear-gradient(135deg, #334155 0%, #475569 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  /* Локальная светлая тема для секций (переопределение глобальной темной) */
  :global(.dark) .vacancy-content.light-theme .requirements-section {
    @apply bg-neutral-50 border border-neutral-200;
    @apply border-l-4 border-l-primary-500;
    background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  :global(.dark) .vacancy-content.light-theme .skills-section {
    @apply bg-neutral-50 border border-neutral-200;
    @apply border-l-4 border-l-success-500;
    background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  /* Глобальная темная тема для текстов и контейнеров */
  :global(.dark) .requirement-label {
    @apply text-slate-300;
  }

  :global(.dark) .requirement-value {
    @apply text-slate-100;
  }

  :global(.dark) .description-container {
    @apply bg-slate-700 border-slate-600;
    @apply border-l-indigo-400;
    background: linear-gradient(135deg, #374151 0%, #4b5563 50%, #374151 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  :global(.dark) .description-container.clickable {
    @apply hover:border-slate-500;
    @apply focus:outline-indigo-400;
  }

  :global(.dark) .description-container.clickable:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }

  :global(.dark) .description-text {
    @apply text-slate-200;
  }

  :global(.dark) .description-content :global(p) {
    @apply text-slate-200;
  }

  :global(.dark) .description-content :global(h1),
  :global(.dark) .description-content :global(h2),
  :global(.dark) .description-content :global(h3) {
    @apply text-slate-100;
  }

  :global(.dark) .description-content :global(li) {
    @apply text-slate-200;
  }

  :global(.dark) .description-content :global(strong),
  :global(.dark) .description-content :global(b) {
    @apply text-slate-100;
  }

  /* Локальная темная тема для текстов и контейнеров */
  .vacancy-content.dark-theme .requirement-label {
    @apply text-slate-300;
  }

  .vacancy-content.dark-theme .requirement-value {
    @apply text-slate-100;
  }

  .vacancy-content.dark-theme .description-container {
    @apply bg-slate-700 border-slate-600;
    @apply border-l-indigo-400;
    background: linear-gradient(135deg, #374151 0%, #4b5563 50%, #374151 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .vacancy-content.dark-theme .description-container.clickable {
    @apply hover:border-slate-500;
    @apply focus:outline-indigo-400;
  }

  .vacancy-content.dark-theme .description-container.clickable:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }

  .vacancy-content.dark-theme .description-text {
    @apply text-slate-200;
  }

  .vacancy-content.dark-theme .description-content :global(p) {
    @apply text-slate-200;
  }

  .vacancy-content.dark-theme .description-content :global(h1),
  .vacancy-content.dark-theme .description-content :global(h2),
  .vacancy-content.dark-theme .description-content :global(h3) {
    @apply text-slate-100;
  }

  .vacancy-content.dark-theme .description-content :global(li) {
    @apply text-slate-200;
  }

  .vacancy-content.dark-theme .description-content :global(strong),
  .vacancy-content.dark-theme .description-content :global(b) {
    @apply text-slate-100;
  }

  /* Локальная светлая тема (переопределение глобальной темной) */
  :global(.dark) .vacancy-content.light-theme .requirement-label {
    @apply text-neutral-600;
  }

  :global(.dark) .vacancy-content.light-theme .requirement-value {
    @apply text-neutral-800;
  }

  :global(.dark) .vacancy-content.light-theme .description-container {
    @apply bg-neutral-50 border border-neutral-200;
    @apply border-l-4 border-l-primary-500;
    background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  :global(.dark) .vacancy-content.light-theme .description-container.clickable {
    @apply hover:border-neutral-300;
    @apply focus:outline-primary-500;
  }

  :global(.dark) .vacancy-content.light-theme .description-container.clickable:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  :global(.dark) .vacancy-content.light-theme .description-text {
    @apply text-neutral-700;
  }

  :global(.dark) .vacancy-content.light-theme .description-content :global(p) {
    @apply text-neutral-700;
  }

  :global(.dark) .vacancy-content.light-theme .description-content :global(h1),
  :global(.dark) .vacancy-content.light-theme .description-content :global(h2),
  :global(.dark) .vacancy-content.light-theme .description-content :global(h3) {
    @apply text-neutral-800;
  }

  :global(.dark) .vacancy-content.light-theme .description-content :global(li) {
    @apply text-neutral-700;
  }

  :global(.dark) .vacancy-content.light-theme .description-content :global(strong),
  :global(.dark) .vacancy-content.light-theme .description-content :global(b) {
    @apply text-neutral-800;
  }
  
  /* Высококонтрастный режим */
  @media (prefers-contrast: high) {
    .content-section {
      @apply border-2;
    }
    
    .section-title {
      @apply text-neutral-900;
      -webkit-text-fill-color: theme('colors.neutral.900');
    }
    
    :global(.dark) .section-title {
      @apply text-slate-100;
      -webkit-text-fill-color: theme('colors.slate.100');
    }

    .vacancy-content.dark-theme .section-title {
      @apply text-slate-100;
      -webkit-text-fill-color: theme('colors.slate.100');
    }

    :global(.dark) .vacancy-content.light-theme .section-title {
      @apply text-neutral-900;
      -webkit-text-fill-color: theme('colors.neutral.900');
    }
    
    .requirements-section {
      @apply border-2 border-primary-600 bg-neutral-100;
    }
    
    :global(.dark) .requirements-section {
      @apply border-2 border-purple-400 bg-slate-600;
    }
    
    .vacancy-content.dark-theme .requirements-section {
      @apply border-2 border-purple-400 bg-slate-600;
    }

    :global(.dark) .vacancy-content.light-theme .requirements-section {
      @apply border-2 border-primary-600 bg-neutral-100;
    }
    
    .skills-section {
      @apply border-2 border-success-600 bg-neutral-100;
    }
    
    :global(.dark) .skills-section {
      @apply border-2 border-blue-400 bg-slate-600;
    }
    
    .vacancy-content.dark-theme .skills-section {
      @apply border-2 border-blue-400 bg-slate-600;
    }

    :global(.dark) .vacancy-content.light-theme .skills-section {
      @apply border-2 border-success-600 bg-neutral-100;
    }
    
    .description-container {
      @apply border-2 border-primary-600 bg-neutral-100;
    }
    
    :global(.dark) .description-container {
      @apply border-2 border-indigo-400 bg-slate-600;
    }
    
    .vacancy-content.dark-theme .description-container {
      @apply border-2 border-indigo-400 bg-slate-600;
    }

    :global(.dark) .vacancy-content.light-theme .description-container {
      @apply border-2 border-primary-600 bg-neutral-100;
    }
  }
</style> 