export interface Deposit {
  id: string;
  goalId: string;
  amount: number;
  slotNumber?: number;
  date: string;
  note?: string;
  createdAt: string;
}
