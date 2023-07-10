<script lang="ts">
    export let data
</script>

<!-- Session is null when signing up -->
{JSON.stringify(data.session)}
<div class="w-full h-screen grid place-items-center">
    <div class="flex flex-col gap-4 w-fit">
        <form method="post" class="w-full">
            <input type="number" class="input" name="verificationCode" />
            <button type="submit" class="btn variant-form-material">Submit</button>
        </form>
    </div>
</div>
