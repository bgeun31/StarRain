# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*getUserJournalEntries*](#getuserjournalentries)
  - [*getAvailableMoods*](#getavailablemoods)
- [**Mutations**](#mutations)
  - [*createMood*](#createmood)
  - [*createJournalEntry*](#createjournalentry)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## getUserJournalEntries
You can execute the `getUserJournalEntries` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getUserJournalEntries(options?: ExecuteQueryOptions): QueryPromise<GetUserJournalEntriesData, undefined>;

interface GetUserJournalEntriesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserJournalEntriesData, undefined>;
}
export const getUserJournalEntriesRef: GetUserJournalEntriesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUserJournalEntries(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserJournalEntriesData, undefined>;

interface GetUserJournalEntriesRef {
  ...
  (dc: DataConnect): QueryRef<GetUserJournalEntriesData, undefined>;
}
export const getUserJournalEntriesRef: GetUserJournalEntriesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserJournalEntriesRef:
```typescript
const name = getUserJournalEntriesRef.operationName;
console.log(name);
```

### Variables
The `getUserJournalEntries` query has no variables.
### Return Type
Recall that executing the `getUserJournalEntries` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserJournalEntriesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `getUserJournalEntries`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUserJournalEntries } from '@dataconnect/generated';


// Call the `getUserJournalEntries()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUserJournalEntries();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUserJournalEntries(dataConnect);

console.log(data.journalEntries);

// Or, you can use the `Promise` API.
getUserJournalEntries().then((response) => {
  const data = response.data;
  console.log(data.journalEntries);
});
```

### Using `getUserJournalEntries`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserJournalEntriesRef } from '@dataconnect/generated';


// Call the `getUserJournalEntriesRef()` function to get a reference to the query.
const ref = getUserJournalEntriesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserJournalEntriesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.journalEntries);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.journalEntries);
});
```

## getAvailableMoods
You can execute the `getAvailableMoods` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getAvailableMoods(options?: ExecuteQueryOptions): QueryPromise<GetAvailableMoodsData, undefined>;

interface GetAvailableMoodsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetAvailableMoodsData, undefined>;
}
export const getAvailableMoodsRef: GetAvailableMoodsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getAvailableMoods(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetAvailableMoodsData, undefined>;

interface GetAvailableMoodsRef {
  ...
  (dc: DataConnect): QueryRef<GetAvailableMoodsData, undefined>;
}
export const getAvailableMoodsRef: GetAvailableMoodsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getAvailableMoodsRef:
```typescript
const name = getAvailableMoodsRef.operationName;
console.log(name);
```

### Variables
The `getAvailableMoods` query has no variables.
### Return Type
Recall that executing the `getAvailableMoods` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetAvailableMoodsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetAvailableMoodsData {
  moods: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    color?: string | null;
  } & Mood_Key)[];
}
```
### Using `getAvailableMoods`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getAvailableMoods } from '@dataconnect/generated';


// Call the `getAvailableMoods()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getAvailableMoods();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getAvailableMoods(dataConnect);

console.log(data.moods);

// Or, you can use the `Promise` API.
getAvailableMoods().then((response) => {
  const data = response.data;
  console.log(data.moods);
});
```

### Using `getAvailableMoods`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getAvailableMoodsRef } from '@dataconnect/generated';


// Call the `getAvailableMoodsRef()` function to get a reference to the query.
const ref = getAvailableMoodsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getAvailableMoodsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.moods);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.moods);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## createMood
You can execute the `createMood` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createMood(vars: CreateMoodVariables): MutationPromise<CreateMoodData, CreateMoodVariables>;

interface CreateMoodRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateMoodVariables): MutationRef<CreateMoodData, CreateMoodVariables>;
}
export const createMoodRef: CreateMoodRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createMood(dc: DataConnect, vars: CreateMoodVariables): MutationPromise<CreateMoodData, CreateMoodVariables>;

interface CreateMoodRef {
  ...
  (dc: DataConnect, vars: CreateMoodVariables): MutationRef<CreateMoodData, CreateMoodVariables>;
}
export const createMoodRef: CreateMoodRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createMoodRef:
```typescript
const name = createMoodRef.operationName;
console.log(name);
```

### Variables
The `createMood` mutation requires an argument of type `CreateMoodVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateMoodVariables {
  name: string;
  description?: string | null;
  color?: string | null;
}
```
### Return Type
Recall that executing the `createMood` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateMoodData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateMoodData {
  mood_insert: Mood_Key;
}
```
### Using `createMood`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createMood, CreateMoodVariables } from '@dataconnect/generated';

// The `createMood` mutation requires an argument of type `CreateMoodVariables`:
const createMoodVars: CreateMoodVariables = {
  name: ..., 
  description: ..., // optional
  color: ..., // optional
};

// Call the `createMood()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createMood(createMoodVars);
// Variables can be defined inline as well.
const { data } = await createMood({ name: ..., description: ..., color: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createMood(dataConnect, createMoodVars);

console.log(data.mood_insert);

// Or, you can use the `Promise` API.
createMood(createMoodVars).then((response) => {
  const data = response.data;
  console.log(data.mood_insert);
});
```

### Using `createMood`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createMoodRef, CreateMoodVariables } from '@dataconnect/generated';

// The `createMood` mutation requires an argument of type `CreateMoodVariables`:
const createMoodVars: CreateMoodVariables = {
  name: ..., 
  description: ..., // optional
  color: ..., // optional
};

// Call the `createMoodRef()` function to get a reference to the mutation.
const ref = createMoodRef(createMoodVars);
// Variables can be defined inline as well.
const ref = createMoodRef({ name: ..., description: ..., color: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createMoodRef(dataConnect, createMoodVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.mood_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.mood_insert);
});
```

## createJournalEntry
You can execute the `createJournalEntry` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createJournalEntry(vars: CreateJournalEntryVariables): MutationPromise<CreateJournalEntryData, CreateJournalEntryVariables>;

interface CreateJournalEntryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateJournalEntryVariables): MutationRef<CreateJournalEntryData, CreateJournalEntryVariables>;
}
export const createJournalEntryRef: CreateJournalEntryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createJournalEntry(dc: DataConnect, vars: CreateJournalEntryVariables): MutationPromise<CreateJournalEntryData, CreateJournalEntryVariables>;

interface CreateJournalEntryRef {
  ...
  (dc: DataConnect, vars: CreateJournalEntryVariables): MutationRef<CreateJournalEntryData, CreateJournalEntryVariables>;
}
export const createJournalEntryRef: CreateJournalEntryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createJournalEntryRef:
```typescript
const name = createJournalEntryRef.operationName;
console.log(name);
```

### Variables
The `createJournalEntry` mutation requires an argument of type `CreateJournalEntryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateJournalEntryVariables {
  entryDate: DateString;
  content: string;
}
```
### Return Type
Recall that executing the `createJournalEntry` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateJournalEntryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateJournalEntryData {
  journalEntry_insert: JournalEntry_Key;
}
```
### Using `createJournalEntry`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createJournalEntry, CreateJournalEntryVariables } from '@dataconnect/generated';

// The `createJournalEntry` mutation requires an argument of type `CreateJournalEntryVariables`:
const createJournalEntryVars: CreateJournalEntryVariables = {
  entryDate: ..., 
  content: ..., 
};

// Call the `createJournalEntry()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createJournalEntry(createJournalEntryVars);
// Variables can be defined inline as well.
const { data } = await createJournalEntry({ entryDate: ..., content: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createJournalEntry(dataConnect, createJournalEntryVars);

console.log(data.journalEntry_insert);

// Or, you can use the `Promise` API.
createJournalEntry(createJournalEntryVars).then((response) => {
  const data = response.data;
  console.log(data.journalEntry_insert);
});
```

### Using `createJournalEntry`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createJournalEntryRef, CreateJournalEntryVariables } from '@dataconnect/generated';

// The `createJournalEntry` mutation requires an argument of type `CreateJournalEntryVariables`:
const createJournalEntryVars: CreateJournalEntryVariables = {
  entryDate: ..., 
  content: ..., 
};

// Call the `createJournalEntryRef()` function to get a reference to the mutation.
const ref = createJournalEntryRef(createJournalEntryVars);
// Variables can be defined inline as well.
const ref = createJournalEntryRef({ entryDate: ..., content: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createJournalEntryRef(dataConnect, createJournalEntryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.journalEntry_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.journalEntry_insert);
});
```

