import { Component, EventEmitter, Input, Output } from '@angular/core';
import { UserNotification } from '../../interfaces/Notification';

@Component({
  selector: 'app-notification',
  templateUrl: './notification-component.html',
  styleUrls: ['./notification-component.css'],
})
export class NotificationComponent {
  @Input() notifications: UserNotification[] = [];
  @Input() unreadCount: number = 0;
  @Output() markAsReadEmitter = new EventEmitter<string>();
  @Output() markAllAsRead = new EventEmitter<void>();

  open = false;

  toggle() {
    this.open = !this.open;
  }

  async markAsRead(notification: UserNotification) {
    if (!notification) return;
    notification.removing = true;

    setTimeout(async () => {
      this.markAsReadEmitter.emit(notification.id);
    }, 300);
  }
}
