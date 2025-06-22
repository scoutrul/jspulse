import { writable } from 'svelte/store';
import type { NotificationData } from '../types/admin.types';

// Стор для уведомлений
export const notifications = writable<NotificationData[]>([]);

// Функция для добавления уведомления
export function showNotification(
  type: NotificationData['type'],
  message: string,
  details?: string
) {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const timestamp = new Date().toLocaleTimeString('ru');

  const notification: NotificationData = {
    id,
    type,
    message,
    details,
    timestamp
  };

  notifications.update(items => [...items, notification]);

  // Автоматически удаляем через 5 секунд
  setTimeout(() => {
    removeNotification(id);
  }, 5000);

  return id;
}

// Функция для удаления уведомления
export function removeNotification(id: string) {
  notifications.update(items => items.filter(item => item.id !== id));
}

// Функция для очистки всех уведомлений
export function clearNotifications() {
  notifications.set([]);
} 