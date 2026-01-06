// Login functionality
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const errorAlert = document.getElementById('errorAlert');
    const registerErrorAlert = document.getElementById('registerErrorAlert');
    const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));

    // Handle login form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');

        // Hide previous errors
        errorAlert.classList.add('d-none');
        
        // Disable button during request
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Entrando...';

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Redirect to admin page on successful login
                window.location.href = '/admin';
            } else {
                // Show error message
                errorAlert.textContent = data.error || 'Erro ao fazer login';
                errorAlert.classList.remove('d-none');
            }
        } catch (error) {
            errorAlert.textContent = 'Erro de conexão. Tente novamente.';
            errorAlert.classList.remove('d-none');
        } finally {
            // Re-enable button
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Entrar';
        }
    });

    // Handle register form submission
    document.getElementById('submitRegister').addEventListener('click', async function() {
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
        const submitBtn = this;

        // Hide previous errors
        registerErrorAlert.classList.add('d-none');

        // Validate form
        if (!username || !email || !password || !passwordConfirm) {
            registerErrorAlert.textContent = 'Todos os campos são obrigatórios';
            registerErrorAlert.classList.remove('d-none');
            return;
        }

        if (password !== passwordConfirm) {
            registerErrorAlert.textContent = 'As senhas não coincidem';
            registerErrorAlert.classList.remove('d-none');
            return;
        }

        if (password.length < 6) {
            registerErrorAlert.textContent = 'A senha deve ter no mínimo 6 caracteres';
            registerErrorAlert.classList.remove('d-none');
            return;
        }

        // Disable button during request
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Criando...';

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Close modal and show success message
                registerModal.hide();
                registerForm.reset();
                
                // Auto-fill login form
                document.getElementById('username').value = username;
                document.getElementById('password').value = password;
                
                // Show success message
                const successDiv = document.createElement('div');
                successDiv.className = 'alert alert-success alert-dismissible fade show';
                successDiv.innerHTML = `
                    <i class="bi bi-check-circle"></i> Conta criada com sucesso! Faça login para continuar.
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                `;
                loginForm.parentElement.insertBefore(successDiv, loginForm);
            } else {
                // Show error message
                registerErrorAlert.textContent = data.error || 'Erro ao criar conta';
                registerErrorAlert.classList.remove('d-none');
            }
        } catch (error) {
            registerErrorAlert.textContent = 'Erro de conexão. Tente novamente.';
            registerErrorAlert.classList.remove('d-none');
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Criar Conta';
        }
    });

    // Clear error when modal is closed
    document.getElementById('registerModal').addEventListener('hidden.bs.modal', function() {
        registerErrorAlert.classList.add('d-none');
        registerForm.reset();
    });
});
