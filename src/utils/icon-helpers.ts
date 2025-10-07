/**
 * Get platform icon based on platform name
 * Matches enum from content.config.ts
 */
export function getPlatformIcon(item: any): string {
  const platform = item.platform;
  const iconMap: Record<string, string> = {
    "Nintendo Switch": "mdi:nintendo-switch",
    "Mobile": "mdi:cellphone",
    "PC": "mdi:desktop-tower",
    "Web": "mdi:web",
    "PlayStation": "mdi:sony-playstation",
    "Xbox": "mdi:microsoft-xbox",
    "Other": "mdi:gamepad"
  }
  
  return iconMap[platform] || "mdi:gamepad-variant"
}

/**
 * Get status icon based on status
 * Matches enum from content.config.ts
 */
export function getStatusIcon(item: any): string {
  const status = item.status;
  const iconMap: Record<string, string> = {
    "Backlog": "mdi:clock-outline",
    "Playing": "mdi:play-circle",
    "Finished": "mdi:check-circle",
    "Paused": "mdi:pause-circle",
    "Dropped": "mdi:close-circle"
  }
  
  return iconMap[status] || "mdi:help-circle"
}

/**
 * Get gadget type icon
 * Matches enum from content.config.ts
 */
export function getGadgetTypeIcon(item: any): string {
  const type = item.type;
  const iconMap: Record<string, string> = {
    "Smartphone": "mdi:cellphone",
    "Tablet": "mdi:tablet",
    "Laptop": "mdi:laptop",
    "Desktop": "mdi:desktop-tower",
    "Monitor": "mdi:monitor",
    "Keyboard": "mdi:keyboard",
    "Mouse": "mdi:mouse",
    "Headphone": "mdi:headphones",
    "Earphone": "mdi:earbuds",
    "Smartwatch": "mdi:watch",
    "Camera": "mdi:camera",
    "Console": "mdi:google-gamepad",
    "Accessory": "mdi:cable-data",
    "Other": "mdi:power-standby"
  }
  
  return iconMap[type] || "mdi:chip"
}
