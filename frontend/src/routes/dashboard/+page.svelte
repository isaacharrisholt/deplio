<script>
  import { SquareStack, Mails, Ship } from 'lucide-svelte'
</script>

<section class="grid gap-8 md:grid-cols-2">
  <a
    href="/dashboard/q"
    class="card flex h-60 flex-row items-center justify-between gap-4 p-8 !transition-none"
  >
    <div class="flex flex-col gap-4">
      <h2 class="h2">Q</h2>
      <p>Effortless serverless message queueing.</p>
    </div>

    <SquareStack size={64} strokeWidth={0.9} />
  </a>

  <div
    class="card flex h-60 flex-row items-center justify-between gap-4 p-8 text-surface-500-400-token"
  >
    <div class="flex flex-col gap-4">
      <h2 class="h2">Email</h2>
      <p>SQL-based email scheduling for developers. Coming soon.</p>
    </div>

    <Mails size={64} strokeWidth={0.9} />
  </div>

  <div
    class="card col-span-full flex h-80 flex-row items-center justify-between gap-4 p-16 text-surface-500-400-token"
  >
    <div class="flex flex-col gap-4">
      <h2 class="h2">Deploy</h2>
      <h3 class="h3">
        Preview branches. For your <span class="font-medium">backend</span>.
      </h3>
      <p>Coming soon.</p>
    </div>

    <Ship size={128} strokeWidth={0.6} />
  </div>
</section>
