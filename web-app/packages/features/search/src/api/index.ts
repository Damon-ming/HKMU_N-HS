export const searchItems = <T extends { title: string }>(items: T[], keyword: string) => items.filter(item => item.title.includes(keyword))
