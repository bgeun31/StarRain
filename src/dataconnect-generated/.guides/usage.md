# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useCreateMood, useCreateJournalEntry, useGetUserJournalEntries, useGetAvailableMoods } from '@dataconnect/generated/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useCreateMood(createMoodVars);

const { data, isPending, isSuccess, isError, error } = useCreateJournalEntry(createJournalEntryVars);

const { data, isPending, isSuccess, isError, error } = useGetUserJournalEntries();

const { data, isPending, isSuccess, isError, error } = useGetAvailableMoods();

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createMood, createJournalEntry, getUserJournalEntries, getAvailableMoods } from '@dataconnect/generated';


// Operation createMood:  For variables, look at type CreateMoodVars in ../index.d.ts
const { data } = await CreateMood(dataConnect, createMoodVars);

// Operation createJournalEntry:  For variables, look at type CreateJournalEntryVars in ../index.d.ts
const { data } = await CreateJournalEntry(dataConnect, createJournalEntryVars);

// Operation getUserJournalEntries: 
const { data } = await GetUserJournalEntries(dataConnect);

// Operation getAvailableMoods: 
const { data } = await GetAvailableMoods(dataConnect);


```