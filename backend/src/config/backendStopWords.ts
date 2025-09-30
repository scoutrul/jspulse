/**
 * Конфигурация стоп-слов для фильтрации вакансий с технологиями бэкенда
 * Используется для исключения вакансий, которые не относятся к JavaScript/TypeScript экосистеме
 */

export const BACKEND_STOP_WORDS = {
  // Языки программирования (кроме JavaScript/TypeScript)
  PROGRAMMING_LANGUAGES: [
    'python', 'py', 'django', 'flask', 'fastapi', 'pandas', 'numpy',
    'java', 'spring', 'springboot', 'spring boot', 'hibernate', 'maven', 'gradle',
    'php', 'laravel', 'symfony', 'codeigniter', 'yii', 'wordpress',
    'c#', 'csharp', 'dotnet', '.net', 'asp.net', 'entity framework',
    'c++', 'cpp', 'qt', 'cmake',
    'go', 'golang', 'gin', 'echo', 'fiber',
    'rust', 'cargo', 'actix', 'tokio',
    'swift', 'ios', 'xcode',
    'kotlin', 'android', 'jetpack',
    'ruby', 'rails', 'ruby on rails', 'sinatra',
    'scala', 'akka', 'play framework',
    'erlang', 'elixir', 'phoenix',
    'haskell', 'clojure', 'lisp',
    'perl', 'bash', 'shell', 'powershell'
  ],

  // Фреймворки и библиотеки бэкенда (кроме Node.js экосистемы)
  BACKEND_FRAMEWORKS: [
    'django', 'flask', 'fastapi', 'tornado', 'bottle',
    'spring', 'springboot', 'spring boot', 'spring mvc', 'spring security',
    'laravel', 'symfony', 'codeigniter', 'yii', 'phalcon',
    'asp.net', 'asp.net core', 'blazor', 'razor',
    'gin', 'echo', 'fiber', 'beego', 'iris',
    'actix', 'rocket', 'warp', 'axum',
    'rails', 'ruby on rails', 'sinatra', 'hanami',
    'akka', 'play framework', 'lift',
    'phoenix', 'plug', 'cowboy',
    'express.js', 'expressjs', 'express js' // Исключаем Express, так как это Node.js
  ],

  // Базы данных (кроме тех, что используются в JS экосистеме)
  DATABASES: [
    'mysql', 'postgresql', 'postgres', 'oracle', 'sql server', 'sqlserver',
    'sqlite', 'firebase', 'firestore', 'supabase',
    'cassandra', 'couchdb', 'couchbase', 'riak',
    'neo4j', 'arangodb', 'orientdb',
    'influxdb', 'timescaledb', 'clickhouse',
    'elasticsearch', 'solr', 'lucene',
    'redis' // Redis часто используется с Node.js, но может быть основным требованием
  ],

  // Инфраструктура и DevOps (кроме JS-специфичных)
  INFRASTRUCTURE: [
    'kubernetes', 'k8s', 'helm', 'istio',
    'docker', 'dockerfile', 'docker compose',
    'terraform', 'ansible', 'puppet', 'chef',
    'jenkins', 'gitlab ci', 'github actions', 'azure devops',
    'aws', 'amazon web services', 'ec2', 's3', 'lambda', 'rds',
    'azure', 'google cloud', 'gcp', 'gke',
    'nginx', 'apache', 'haproxy',
    'prometheus', 'grafana', 'elk stack', 'elastic stack',
    'consul', 'etcd', 'zookeeper'
  ],

  // Специфичные технологии бэкенда
  BACKEND_TECHNOLOGIES: [
    // Убираем 'backend' и 'бэкенд' - они используются в фронтенд вакансиях для обозначения работы с API
    'microservices', 'microservice', 'soa', 'service oriented architecture',
    'rest api', 'graphql', 'grpc', 'soap', 'xml',
    'jwt', 'oauth', 'oauth2', 'ldap', 'saml',
    'kafka', 'rabbitmq', 'activemq', 'apache kafka',
    'apache spark', 'hadoop', 'hive', 'pig',
    'tensorflow', 'pytorch', 'scikit-learn', 'machine learning', 'ml',
    'blockchain', 'ethereum', 'bitcoin', 'solidity',
    'opencv', 'computer vision', 'image processing'
  ],

  // Позиции, которые обычно не связаны с JS разработкой
  POSITIONS: [
    'data scientist', 'data engineer', 'data analyst',
    'devops engineer', 'site reliability engineer', 'sre',
    'system administrator', 'sysadmin', 'linux administrator',
    'database administrator', 'dba',
    'security engineer', 'cybersecurity', 'penetration tester',
    'mobile developer', 'ios developer', 'android developer',
    'game developer', 'unity', 'unreal engine',
    'embedded developer', 'firmware developer',
    'qa engineer', 'test engineer', 'automation engineer',
    'business analyst', 'product manager', 'project manager',
    'sales engineer', 'technical writer', 'technical support'
  ],

  // Дополнительные ключевые слова для исключения
  ADDITIONAL_KEYWORDS: [
    'legacy', 'mainframe', 'cobol', 'fortran',
    'enterprise', 'corporate', 'banking', 'fintech',
    'iot', 'internet of things', 'embedded systems',
    'robotics', 'automation', 'plc programming',
    'sap', 'oracle erp', 'salesforce', 'dynamics',
    'bi', 'business intelligence', 'etl', 'data warehouse'
  ]
} as const;

/**
 * Объединенный список всех стоп-слов для удобного использования
 */
export const ALL_BACKEND_STOP_WORDS = [
  ...BACKEND_STOP_WORDS.PROGRAMMING_LANGUAGES,
  ...BACKEND_STOP_WORDS.BACKEND_FRAMEWORKS,
  ...BACKEND_STOP_WORDS.DATABASES,
  ...BACKEND_STOP_WORDS.INFRASTRUCTURE,
  ...BACKEND_STOP_WORDS.BACKEND_TECHNOLOGIES,
  ...BACKEND_STOP_WORDS.POSITIONS,
  ...BACKEND_STOP_WORDS.ADDITIONAL_KEYWORDS
];

/**
 * Функция для проверки, содержит ли текст стоп-слова
 * @param text - текст для проверки
 * @returns true, если текст содержит стоп-слова
 */
export function containsBackendStopWords(text: string): boolean {
  const normalizedText = text.toLowerCase();

  return ALL_BACKEND_STOP_WORDS.some(stopWord => {
    const normalizedStopWord = stopWord.toLowerCase();

    // Специальная обработка для символов, которые могут быть проблематичными в regex
    const escapedStopWord = normalizedStopWord
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/#/g, '\\#');

    // Для специальных символов (как C#, .NET) используем более гибкий поиск
    if (normalizedStopWord.includes('#') || normalizedStopWord.includes('.')) {
      // Для специальных символов ищем точное совпадение без границ слов
      const regex = new RegExp(escapedStopWord, 'i');
      return regex.test(normalizedText);
    } else {
      // Для обычных слов используем границы слов
      const regex = new RegExp(`\\b${escapedStopWord}\\b`, 'i');
      return regex.test(normalizedText);
    }
  });
}

/**
 * Функция для получения найденных стоп-слов в тексте
 * @param text - текст для проверки
 * @returns массив найденных стоп-слов
 */
export function findBackendStopWords(text: string): string[] {
  const normalizedText = text.toLowerCase();

  return ALL_BACKEND_STOP_WORDS.filter(stopWord => {
    const normalizedStopWord = stopWord.toLowerCase();

    // Специальная обработка для символов, которые могут быть проблематичными в regex
    const escapedStopWord = normalizedStopWord
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/#/g, '\\#');

    // Для специальных символов (как C#, .NET) используем более гибкий поиск
    if (normalizedStopWord.includes('#') || normalizedStopWord.includes('.')) {
      // Для специальных символов ищем точное совпадение без границ слов
      const regex = new RegExp(escapedStopWord, 'i');
      return regex.test(normalizedText);
    } else {
      // Для обычных слов используем границы слов
      const regex = new RegExp(`\\b${escapedStopWord}\\b`, 'i');
      return regex.test(normalizedText);
    }
  });
}

/**
 * Функция для фильтрации массива текстов по стоп-словам
 * @param texts - массив текстов для фильтрации
 * @returns массив текстов без стоп-слов
 */
export function filterByBackendStopWords(texts: string[]): string[] {
  return texts.filter(text => !containsBackendStopWords(text));
}
