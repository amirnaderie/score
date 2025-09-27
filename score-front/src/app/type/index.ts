export const LogMethodLabels: Record<string, string> = {
  createScore: "ایجاد امتیاز",
  updateScore: "بروزرسانی امتیاز",
  transferScore: "انتقال امتیاز",
  reverseTransfer: "عودت امتیاز",
};
export interface User {
  userId?: string;
  roles?: [string];
  branchCode?: number;
  personelCode?: number;
}