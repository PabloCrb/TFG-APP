import { Injectable } from '@angular/core';
import { API_URL } from '../constants';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  async getNotifications() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/notifications/getNotifications`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Error fetching notifications');
    }
    return data.data;
  }

  async markAsRead(notificationId: string) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/notifications/markAsRead`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notificationId }),
    });
    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.message || 'Error marking notification as read');
    }
    return data.data;
  }
}
