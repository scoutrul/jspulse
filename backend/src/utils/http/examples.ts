// Примеры использования HTTP-адаптера
import { 
  createHttpClient, 
  httpClient, 
  HeadHunterClient 
} from "./index";

// Пример 1: Использование HTTP-клиента по умолчанию
async function exampleDefaultClient() {
  try {
    // Простой GET-запрос
    const data = await httpClient.get("https://api.example.com/data");
    console.log("Получены данные:", data);
    
    // POST-запрос с телом
    const result = await httpClient.post("https://api.example.com/submit", { 
      name: "Тестовый пользователь", 
      email: "test@example.com" 
    });
    console.log("Результат отправки:", result);
  } catch (error) {
    console.error("Ошибка при запросе:", error);
  }
}

// Пример 2: Создание настраиваемого клиента
async function exampleCustomClient() {
  // Создаем клиент с кэшированием и логированием
  const client = createHttpClient({
    baseUrl: "https://api.example.com/v2",
    logging: true,
    caching: {
      ttl: 5 * 60 * 1000, // 5 минут
      maxSize: 50
    },
    defaultHeaders: {
      "Authorization": "Bearer YOUR_TOKEN_HERE",
      "Content-Type": "application/json"
    }
  });
  
  try {
    // Этот запрос будет кэшироваться
    const users = await client.get<any[]>("users");
    console.log(`Получено ${users.length} пользователей`);
    
    // Повторный запрос возьмется из кэша (и будет логироваться)
    const cachedUsers = await client.get<any[]>("users");
    console.log(`Получено из кэша: ${cachedUsers.length} пользователей`);
  } catch (error) {
    console.error("Ошибка при запросе с кэшированием:", error);
  }
}

// Пример 3: Использование адаптера HeadHunter
async function exampleHeadHunterApi() {
  // Создаем клиент для работы с HeadHunter API
  const hhClient = new HeadHunterClient({
    logging: true
  });
  
  try {
    // Поиск вакансий
    const searchResult = await hhClient.searchVacancies({
      text: "JavaScript developer",
      area: 1, // Москва
      per_page: 10,
      page: 0,
      only_with_salary: true
    });
    
    console.log(`Найдено ${searchResult.found} вакансий. Показано ${searchResult.items.length}`);
    
    // Вывод краткой информации о первой вакансии
    if (searchResult.items.length > 0) {
      const firstVacancy = searchResult.items[0];
      console.log(`Вакансия: ${firstVacancy.name}`);
      console.log(`Компания: ${firstVacancy.employer.name}`);
      
      if (firstVacancy.salary) {
        const { from, to, currency } = firstVacancy.salary;
        const salaryText = from && to
          ? `${from} - ${to} ${currency}`
          : from 
            ? `от ${from} ${currency}`
            : to
              ? `до ${to} ${currency}`
              : 'не указана';
        console.log(`Зарплата: ${salaryText}`);
      }
      
      // Получение подробной информации о вакансии
      const detailedVacancy = await hhClient.getVacancy(firstVacancy.id);
      console.log(`Подробная информация получена: ${detailedVacancy.alternate_url}`);
    }
  } catch (error) {
    console.error("Ошибка при работе с HeadHunter API:", error);
  }
}

// Экспортируем примеры для возможного вызова
export const examples = {
  defaultClient: exampleDefaultClient,
  customClient: exampleCustomClient,
  headHunterApi: exampleHeadHunterApi
}; 