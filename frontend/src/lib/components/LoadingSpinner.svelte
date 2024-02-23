<script lang="ts">
  import { ConicGradient, type ConicStop } from '@skeletonlabs/skeleton'

  const conicStops: ConicStop[] = [
    { color: 'transparent', start: 0, end: 25 },
    { color: 'rgb(var(--color-primary-500))', start: 75, end: 100 },
  ]

  export let width = 'w-3'
</script>

<ConicGradient stops={conicStops} spin {width} />
