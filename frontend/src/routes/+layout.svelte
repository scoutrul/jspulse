
<div class="app-container">
  <header>
    <a href="/" class="header-link">
      <img src="/jspulse.png" alt="JS Пульс логотип" class="logo" />
      <h1>JS Пульс</h1>
      <p class="description">Агрегатор вакансий по Frontend/JavaScript</p>
    </a>
  </header>

  <main class="content">
    <slot />
  </main>

  <!-- Можно добавить футер здесь -->
  <!-- 
  <footer>
    <p>© {new Date().getFullYear()} JS Пульс</p>
  </footer>
  -->
</div>

<style>
  .app-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  header {
    background-color: #fff; /* Или другой фон, если нужно */
    padding: 1rem 2rem; /* Добавим немного отступов */
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    /* display: flex; - убираем, т.к. flex теперь на ссылке */
    /* align-items: center; - убираем */
    /* margin-bottom: 1rem; - убираем, отступ будет у main */
  }

  .header-link {
    display: flex;
    align-items: center;
    text-decoration: none; /* Убираем подчеркивание ссылки */
    color: inherit; /* Наследуем цвет текста */
  }

  .logo {
    width: 50px; /* Немного уменьшим лого в хедере */
    height: 50px;
    margin-right: 1rem;
  }

  h1 {
    color: #fdc007;
    margin: 0;
    font-size: 1.5rem; /* Немного уменьшим заголовок в хедере */
  }

  .content {
    flex-grow: 1; /* Основной контент занимает оставшееся место */
    padding: 1rem 2rem; /* Добавим отступы для основного контента */
    max-width: 1100px; /* Можно ограничить ширину контента */
    margin: 1rem auto; /* Центрируем контент и добавляем отступ сверху */
  }

  .description {
    margin-left: auto;
  }

  /* Стили для футера, если он будет добавлен */
  /*
  footer {
    text-align: center;
    padding: 1rem;
    margin-top: auto; 
    background-color: #f8f8f8;
    color: #666;
    font-size: 0.9rem;
  }
  */
</style> 