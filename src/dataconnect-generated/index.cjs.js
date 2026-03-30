const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'starrain',
  location: 'us-east1'
};
exports.connectorConfig = connectorConfig;

const createMoodRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'createMood', inputVars);
}
createMoodRef.operationName = 'createMood';
exports.createMoodRef = createMoodRef;

exports.createMood = function createMood(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createMoodRef(dcInstance, inputVars));
}
;

const createJournalEntryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'createJournalEntry', inputVars);
}
createJournalEntryRef.operationName = 'createJournalEntry';
exports.createJournalEntryRef = createJournalEntryRef;

exports.createJournalEntry = function createJournalEntry(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createJournalEntryRef(dcInstance, inputVars));
}
;

const getUserJournalEntriesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getUserJournalEntries');
}
getUserJournalEntriesRef.operationName = 'getUserJournalEntries';
exports.getUserJournalEntriesRef = getUserJournalEntriesRef;

exports.getUserJournalEntries = function getUserJournalEntries(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getUserJournalEntriesRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getAvailableMoodsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getAvailableMoods');
}
getAvailableMoodsRef.operationName = 'getAvailableMoods';
exports.getAvailableMoodsRef = getAvailableMoodsRef;

exports.getAvailableMoods = function getAvailableMoods(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getAvailableMoodsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;
