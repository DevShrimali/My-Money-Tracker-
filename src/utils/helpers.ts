// Currency formats
export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val);
};

// Date layout helpers
export const calculateDaysRemaining = (targetDateStr: string, isPaid: boolean, type: string) => {
  if (isPaid || type === 'income') return { daysRemaining: 0, status: 'complete' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return { daysRemaining: days };
};

// Format date helper
export const formatDateString = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
};
