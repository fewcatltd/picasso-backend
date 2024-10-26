import promClient from 'prom-client';

export const taskCounter = new promClient.Counter({
  name: 'processed_tasks_total',
  help: 'Total number of processed tasks',
});

export const errorCounter = new promClient.Counter({
  name: 'failed_tasks_total',
  help: 'Total number of failed tasks',
});
