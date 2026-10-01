const Workflow = require('../models/Workflow');
const { ResourceNotFoundException } = require('../utils/errors');

async function createWorkflow(user, { name, description, steps }) {
  const workflow = await Workflow.create({
    name,
    description,
    createdBy: user.id,
    steps: steps.map((s) => ({
      stepIndex: s.stepIndex,
      stepName: s.stepName,
      requiredRole: s.requiredRole,
      requiredApprovals: s.requiredApprovals ?? 1,
      slaHours: s.slaHours ?? null,
    })),
  });
  return workflow.toJSON();
}

async function getAllWorkflows() {
  const workflows = await Workflow.find();
  return workflows.map((w) => w.toJSON());
}

async function getWorkflowById(id) {
  const workflow = await Workflow.findById(id).catch(() => null);
  if (!workflow) throw new ResourceNotFoundException(`Workflow not found with id: ${id}`);
  return workflow.toJSON();
}

async function deleteWorkflow(id) {
  const workflow = await Workflow.findById(id).catch(() => null);
  if (!workflow) throw new ResourceNotFoundException(`Workflow not found with id: ${id}`);
  await Workflow.deleteOne({ _id: id });
}

module.exports = { createWorkflow, getAllWorkflows, getWorkflowById, deleteWorkflow };
