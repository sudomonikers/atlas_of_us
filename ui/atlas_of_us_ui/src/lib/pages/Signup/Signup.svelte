<script lang="ts">
    import { API_BASE } from "../../../environment";

    async function signUp() {
        const response = await fetch(`${API_BASE}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // Include signup data here, e.g.,
                // username: 'example',
                // password: 'password123'
            })
        });

        if (response.ok) {
            // Handle successful signup
            console.log('Signup successful');
        } else {
            // Handle signup error
            console.error('Signup failed');
        }
    }
</script>

<div class="in-nav-container">

</div>

<style>
    
</style>