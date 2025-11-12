<script lang="ts">
  import { onMount } from "svelte";
  import { Stream, Effect } from "effect";
  import type { User } from "@effect-recipes/rpc";
  import { UsersClient } from "$lib/rpc-client";

  let users = $state<User[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  let newUserName = $state("");
  let newUserEmail = $state("");
  let creating = $state(false);

  async function loadUsers() {
    loading = true;
    error = null;

    try {
      console.log("loadUsers..");
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* UsersClient;
          const userStream = yield* Stream.runCollect(client.UserList());
          return userStream;
        }).pipe(Effect.provide(UsersClient.Default))
      );
      users = Array.from(result);
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load users";
      console.error("Error loading users:", e);
    } finally {
      loading = false;
    }
  }

  async function handleCreateUser() {
    if (!newUserName || !newUserEmail) return;

    creating = true;
    error = null;

    try {
      await Effect.runPromise(
        Effect.gen(function* () {
          const client = yield* UsersClient;
          return yield* client.UserCreate({
            name: newUserName,
            email: newUserEmail,
          });
        })
          .pipe(Effect.provide(UsersClient.Default))
          .pipe(Effect.scoped)
      );

      // Reset form
      newUserName = "";
      newUserEmail = "";

      // Reload users
      await loadUsers();
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to create user";
      console.error("Error creating user:", e);
    } finally {
      creating = false;
    }
  }

  onMount(() => {
    loadUsers();
  });
</script>

<div class="p-6 max-w-2xl mx-auto">
  <h1 class="text-2xl font-bold mb-6">Users</h1>

  {#if error}
    <div
      class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
    >
      {error}
    </div>
  {/if}

  <div class="mb-6 p-4 border rounded">
    <h2 class="text-lg font-semibold mb-4">Create New User</h2>
    <form
      onsubmit={(e) => {
        e.preventDefault();
        handleCreateUser();
      }}
      class="space-y-3"
    >
      <div>
        <label class="block text-sm font-medium mb-1">
          Name
          <input
            type="text"
            bind:value={newUserName}
            class="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            placeholder="Enter name"
            required
          />
        </label>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">
          Email
          <input
            type="email"
            bind:value={newUserEmail}
            class="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
            placeholder="Enter email"
            required
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={creating || !newUserName || !newUserEmail}
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {creating ? "Creating..." : "Create User"}
      </button>
    </form>
  </div>

  {#if loading}
    <div class="text-center py-8">Loading users...</div>
  {:else if users.length === 0}
    <div class="text-center py-8 text-gray-500">No users found</div>
  {:else}
    <ul class="space-y-2">
      {#each users as user}
        <li class="border rounded p-4 hover:bg-gray-50">
          <div class="font-medium">{user.name}</div>
          <div class="text-sm text-gray-600">{user.email}</div>
          <div class="text-xs text-gray-400">ID: {user.id}</div>
        </li>
      {/each}
    </ul>
  {/if}
</div>
