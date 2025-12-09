// Available toppings for drinks
export const TOPPINGS = [
  { id: 22, name: 'Marshmallows' },
  { id: 23, name: 'Caramel' },
  { id: 24, name: 'Whipped Cream' },
  { id: 25, name: 'Cherry' },
] as const;

export type ToppingId = typeof TOPPINGS[number]['id'];