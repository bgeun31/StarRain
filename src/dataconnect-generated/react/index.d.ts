import { CreateMoodData, CreateMoodVariables, CreateJournalEntryData, CreateJournalEntryVariables, GetUserJournalEntriesData, GetAvailableMoodsData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateMood(options?: useDataConnectMutationOptions<CreateMoodData, FirebaseError, CreateMoodVariables>): UseDataConnectMutationResult<CreateMoodData, CreateMoodVariables>;
export function useCreateMood(dc: DataConnect, options?: useDataConnectMutationOptions<CreateMoodData, FirebaseError, CreateMoodVariables>): UseDataConnectMutationResult<CreateMoodData, CreateMoodVariables>;

export function useCreateJournalEntry(options?: useDataConnectMutationOptions<CreateJournalEntryData, FirebaseError, CreateJournalEntryVariables>): UseDataConnectMutationResult<CreateJournalEntryData, CreateJournalEntryVariables>;
export function useCreateJournalEntry(dc: DataConnect, options?: useDataConnectMutationOptions<CreateJournalEntryData, FirebaseError, CreateJournalEntryVariables>): UseDataConnectMutationResult<CreateJournalEntryData, CreateJournalEntryVariables>;

export function useGetUserJournalEntries(options?: useDataConnectQueryOptions<GetUserJournalEntriesData>): UseDataConnectQueryResult<GetUserJournalEntriesData, undefined>;
export function useGetUserJournalEntries(dc: DataConnect, options?: useDataConnectQueryOptions<GetUserJournalEntriesData>): UseDataConnectQueryResult<GetUserJournalEntriesData, undefined>;

export function useGetAvailableMoods(options?: useDataConnectQueryOptions<GetAvailableMoodsData>): UseDataConnectQueryResult<GetAvailableMoodsData, undefined>;
export function useGetAvailableMoods(dc: DataConnect, options?: useDataConnectQueryOptions<GetAvailableMoodsData>): UseDataConnectQueryResult<GetAvailableMoodsData, undefined>;
