const Request = require('../models/Request');
const Workflow = require('../models/Workflow');
const { ResourceNotFoundException, BadRequestException } = require('../utils/errors');
const { GENESIS_HASH, computeHash } = require('../utils/hash');

async function createRequest(user, { title, description, workflowId }) {
  const workflow = await Workflow.findById(workflowId).catch(() => null);
  if (!workflow) throw new ResourceNotFoundException('Workflow not found');

  const request = await Request.create({
    title,
    description,
    workflowId: workflow.id,
    workflowName: workflow.name,
    createdBy: user.id,
    createdByName: user.name,
    currentStep: 0,
    status: 'PENDING',
    history: [],
    updatedAt: new Date(),
  });

  return request.toJSON();
}

async function getMyRequests(user) {
  const requests = await Request.find({ createdBy: user.id });
  return requests.map((r) => r.toJSON());
}

async function getPendingRequests(user) {
  const combined = await Request.find({ status: { $in: ['PENDING', 'IN_REVIEW'] } });

  const result = [];
  for (const request of combined) {
    const workflow = await Workflow.findById(request.workflowId).catch(() => null);
    if (!workflow || workflow.steps.length === 0) continue;
    if (request.currentStep >= workflow.steps.length) continue;

    const currentStep = workflow.steps[request.currentStep];
    if (currentStep.requiredRole === user.role) {
      result.push(request.toJSON());
    }
  }
  return result;
}

async function getRequestById(id) {
  const request = await Request.findById(id).catch(() => null);
  if (!request) throw new ResourceNotFoundException('Request not found');
  return request.toJSON();
}

async function approveRequest(user, id, comment) {
  return processRequest(user, id, 'APPROVED', comment);
}

async function rejectRequest(user, id, comment) {
  return processRequest(user, id, 'REJECTED', comment);
}

async function processRequest(user, requestId, actionType, comment) {
  const request = await Request.findById(requestId).catch(() => null);
  if (!request) throw new ResourceNotFoundException('Request not found');

  if (request.status === 'APPROVED' || request.status === 'REJECTED') {
    throw new BadRequestException('Request already finalized');
  }

  const workflow = await Workflow.findById(request.workflowId).catch(() => null);
  if (!workflow) throw new ResourceNotFoundException('Workflow not found');

  if (request.currentStep >= workflow.steps.length) {
    throw new BadRequestException('Invalid workflow step');
  }

  const currentStep = workflow.steps[request.currentStep];
  if (currentStep.requiredRole !== user.role) {
    throw new BadRequestException('User role does not match required role for this step');
  }

  const previousHash = request.history.length > 0 ? request.history[request.history.length - 1].currentHash : GENESIS_HASH;
  const timestamp = new Date();
  const currentHash = computeHash({
    stepIndex: request.currentStep,
    action: actionType,
    actedBy: user.id,
    comment,
    timestamp: timestamp.toISOString(),
    previousHash,
  });

  request.history.push({
    stepIndex: request.currentStep,
    action: actionType,
    actedBy: user.id,
    actedByName: user.name,
    comment,
    timestamp,
    previousHash,
    currentHash,
  });
  request.updatedAt = timestamp;

  if (actionType === 'REJECTED') {
    request.status = 'REJECTED';
  } else {
    const nextStep = request.currentStep + 1;
    if (nextStep >= workflow.steps.length) {
      request.status = 'APPROVED';
    } else {
      request.currentStep = nextStep;
      request.status = 'IN_REVIEW';
    }
  }

  await request.save();
  return request.toJSON();
}

async function getAllRequests() {
  const requests = await Request.find();
  return requests.map((r) => r.toJSON());
}

module.exports = {
  createRequest,
  getMyRequests,
  getPendingRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  getAllRequests,
};
