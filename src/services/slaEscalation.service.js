const Request = require('../models/Request');
const Workflow = require('../models/Workflow');

const HOUR_MS = 60 * 60 * 1000;

// Mirrors SlaEscalationService: hourly job that escalates a request's
// current step to ADMIN once its SLA deadline has passed.
async function checkAndEscalateRequests() {
  const activeRequests = await Request.find({ status: { $in: ['PENDING', 'IN_REVIEW'] } });

  let escalatedCount = 0;
  for (const request of activeRequests) {
    if (request.escalated) continue;
    try {
      if (await checkAndEscalateIfNeeded(request)) escalatedCount++;
    } catch (err) {
      console.error(`Error processing request ${request.id} for SLA escalation:`, err.message);
    }
  }

  console.log(`SLA escalation check completed. Escalated ${escalatedCount} requests.`);
  return escalatedCount;
}

async function checkAndEscalateIfNeeded(request) {
  const workflow = await Workflow.findById(request.workflowId).catch(() => null);
  if (!workflow || request.currentStep >= workflow.steps.length) return false;

  const currentStep = workflow.steps[request.currentStep];
  if (!currentStep.slaHours || currentStep.slaHours <= 0) return false;

  const stepStartTime = request.stepStartTimes.get(String(request.currentStep)) || request.createdAt;
  const hoursElapsed = (Date.now() - new Date(stepStartTime).getTime()) / HOUR_MS;

  if (hoursElapsed > currentStep.slaHours) {
    request.escalated = true;
    request.originalRequiredRole = currentStep.requiredRole;
    workflow.steps[request.currentStep].requiredRole = 'ADMIN';

    await workflow.save();
    await request.save();
    console.log(`Request ${request.id} escalated to ADMIN due to SLA breach`);
    return true;
  }

  return false;
}

function startScheduler() {
  setInterval(() => {
    checkAndEscalateRequests().catch((err) => console.error('SLA escalation run failed:', err));
  }, HOUR_MS);
}

module.exports = { checkAndEscalateRequests, startScheduler };
