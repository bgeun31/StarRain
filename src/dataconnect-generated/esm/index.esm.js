import { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'starrain',
  location: 'us-east1'
};
export const createMoodRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'createMood', inputVars);
}
createMoodRef.operationName = 'createMood';

export function createMood(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createMoodRef(dcInstance, inputVars));
}

export const createJournalEntryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'createJournalEntry', inputVars);
}
createJournalEntryRef.operationName = 'createJournalEntry';

export function createJournalEntry(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createJournalEntryRef(dcInstance, inputVars));
}

export const getUserJournalEntriesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getUserJournalEntries');
}
getUserJournalEntriesRef.operationName = 'getUserJournalEntries';

export function getUserJournalEntries(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getUserJournalEntriesRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getAvailableMoodsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'getAvailableMoods');
}
getAvailableMoodsRef.operationName = 'getAvailableMoods';

export function getAvailableMoods(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getAvailableMoodsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

