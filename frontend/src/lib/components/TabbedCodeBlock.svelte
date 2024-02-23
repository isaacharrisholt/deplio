<script lang="ts">
  import { TabGroup, Tab } from '@skeletonlabs/skeleton'
  import CodeBlock, { type LanguageWithCode } from '$lib/components/CodeBlock.svelte'

  export let languages: LanguageWithCode[]

  let currentTab = 0
</script>

<div class="card variant-soft-surface p-4">
  <TabGroup>
    {#each languages as { language }, i}
      <Tab bind:group={currentTab} name={language} value={i}>
        {language}
      </Tab>
    {/each}

    <svelte:fragment slot="panel">
      <CodeBlock
        code={languages[currentTab].code}
        language={languages[currentTab].language}
        lineNumbers={languages[currentTab].lineNumbers}
      />
    </svelte:fragment>
  </TabGroup>
</div>
