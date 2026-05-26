export const formatDate = (value) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));

export const gradeClass = (grade) => {
  const classes = {
    A: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    B: 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-200',
    C: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    D: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
    F: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200'
  };
  return classes[grade] || classes.C;
};
