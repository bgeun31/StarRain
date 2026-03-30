import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateJournalEntryData {
  journalEntry_insert: JournalEntry_Key;
}

export interface CreateJournalEntryVariables {
  entryDate: DateString;
  content: string;
}

export interface CreateMoodData {
  mood_insert: Mood_Key;
}

export interface CreateMoodVariables {
  name: string;
  description?: string | null;
  color?: string | null;
}

export interface EntryMood_Key {
  journalEntryId: UUIDString;
  moodId: UUIDString;
  __typename?: 'EntryMood_Key';
}

export interface GetAvailableMoodsData {
  moods: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    color?: string | null;
  } & Mood_Key)[];
}

export interface GetUserJournalEntriesData {
  journalEntries: ({
    id: UUIDString;
    entryDate: DateString;
    content: string;
    createdAt: TimestampString;
    updatedAt: TimestampString;
    moods_via_EntryMood: ({
      id: UUIDString;
      name: string;
      description?: string | null;
      color?: string | null;
    } & Mood_Key)[];
  } & JournalEntry_Key)[];
}

export interface JournalEntry_Key {
  id: UUIDString;
  __typename?: 'JournalEntry_Key';
}

export interface Mood_Key {
  id: UUIDString;
  __typename?: 'Mood_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateMoodRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateMoodVariables): MutationRef<CreateMoodData, CreateMoodVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateMoodVariables): MutationRef<CreateMoodData, CreateMoodVariables>;
  operationName: string;
}
export const createMoodRef: CreateMoodRef;

export function createMood(vars: CreateMoodVariables): MutationPromise<CreateMoodData, CreateMoodVariables>;
export function createMood(dc: DataConnect, vars: CreateMoodVariables): MutationPromise<CreateMoodData, CreateMoodVariables>;

interface CreateJournalEntryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateJournalEntryVariables): MutationRef<CreateJournalEntryData, CreateJournalEntryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateJournalEntryVariables): MutationRef<CreateJournalEntryData, CreateJournalEntryVariables>;
  operationName: string;
}
export const createJournalEntryRef: CreateJournalEntryRef;

export function createJournalEntry(vars: CreateJournalEntryVariables): MutationPromise<CreateJournalEntryData, CreateJournalEntryVariables>;
export function createJournalEntry(dc: DataConnect, vars: CreateJournalEntryVariables): MutationPromise<CreateJournalEntryData, CreateJournalEntryVariables>;

interface GetUserJournalEntriesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserJournalEntriesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetUserJournalEntriesData, undefined>;
  operationName: string;
}
export const getUserJournalEntriesRef: GetUserJournalEntriesRef;

export function getUserJournalEntries(options?: ExecuteQueryOptions): QueryPromise<GetUserJournalEntriesData, undefined>;
export function getUserJournalEntries(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserJournalEntriesData, undefined>;

interface GetAvailableMoodsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetAvailableMoodsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetAvailableMoodsData, undefined>;
  operationName: string;
}
export const getAvailableMoodsRef: GetAvailableMoodsRef;

export function getAvailableMoods(options?: ExecuteQueryOptions): QueryPromise<GetAvailableMoodsData, undefined>;
export function getAvailableMoods(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetAvailableMoodsData, undefined>;

