const API_BASE_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToLogin = document.getElementById('switch-to-login');
    const acctTypeModal = document.getElementById('acctTypeModal');
    const collegeSignupForm = document.getElementById('college-signup-form');
    const addCourseBtn = document.getElementById('addCourseBtn');
    const cancelCollegeSignup = document.getElementById('cancelCollegeSignup');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');
    
    // Ensure login form is visible by default
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
    
    // Switch to Signup Form
    switchToSignup.addEventListener('click', function(e) {
        e.preventDefault();
        openAcctTypeModal();
    });

    function openAcctTypeModal(){
        if(!acctTypeModal) return;
        acctTypeModal.setAttribute('aria-hidden','false');
        document.body.classList.add('modal-open');
    }
    function closeAcctTypeModal(){
        if(!acctTypeModal) return;
        acctTypeModal.setAttribute('aria-hidden','true');
        document.body.classList.remove('modal-open');
    }
    acctTypeModal?.addEventListener('click', (e)=>{
        if(e.target.dataset.close || e.target.classList.contains('acct-modal')) closeAcctTypeModal();
    });
    acctTypeModal?.querySelectorAll('.acct-type-choice').forEach(btn=>{
        btn.addEventListener('click', ()=>{
            const type = btn.dataset.type;
            closeAcctTypeModal();
            if(type==='self'){
                loginForm.classList.remove('active');
                signupForm.classList.add('active');
            } else if(type==='college') {
                // Open wizard overlay
                if(window.__openCollegeWizard) window.__openCollegeWizard();
            }
        });
    });

    cancelCollegeSignup?.addEventListener('click', ()=>{
        collegeSignupForm.style.display='none';
        loginForm.classList.add('active');
    });

    // Dynamic Courses Logic
    addCourseBtn?.addEventListener('click', ()=>{
        const wrap = document.getElementById('coursesWrap');
        if(!wrap) return;
        const row = document.createElement('div');
        row.className='course-row';
        row.innerHTML = `
            <input type="text" placeholder="Course Name" class="course-name" required>
            <input type="text" placeholder="Level (UG/PG/Diploma)" class="course-level" required>
            <input type="text" placeholder="Duration" class="course-duration" required>
            <button type="button" class="remove-course" aria-label="Remove course">&times;</button>`;
        wrap.appendChild(row);
    });
    document.getElementById('coursesWrap')?.addEventListener('click', e=>{
        const btn = e.target.closest('.remove-course');
        if(btn){
            const row = btn.closest('.course-row');
            if(row && row.parentElement.children.length>1) row.remove();
        }
    });
    
    // Switch to Login Form
    switchToLogin.addEventListener('click', function(e) {
        e.preventDefault();
        signupForm.classList.remove('active');
        loginForm.classList.add('active');
        hideMessages();
    });
    
    // Hide messages function
    function hideMessages() {
        if (successMessage) successMessage.classList.add('is-hidden');
        if (errorMessage) errorMessage.classList.add('is-hidden');
    }
    
    // Show success message
    function showSuccess(message) {
        if (successMessage) {
            successMessage.textContent = message;
            successMessage.classList.remove('is-hidden');
        }
        if (errorMessage) errorMessage.classList.add('is-hidden');
    }
    
    // Show error message
    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.classList.remove('is-hidden');
        }
        if (successMessage) successMessage.classList.add('is-hidden');
    }
    
    // Make Private/Public checkboxes behave like a radio group
    (function(){
        const cbPrivate = document.getElementById('visibility-private');
        const cbPublic = document.getElementById('visibility-public');
        if(cbPrivate && cbPublic){
            // Default to public if none selected
            if(!cbPrivate.checked && !cbPublic.checked){ cbPublic.checked = true; }
            cbPrivate.addEventListener('change', ()=>{
                if(cbPrivate.checked) cbPublic.checked = false; 
                if(!cbPrivate.checked && !cbPublic.checked) cbPublic.checked = true; // keep one on
            });
            cbPublic.addEventListener('change', ()=>{
                if(cbPublic.checked) cbPrivate.checked = false; 
                if(!cbPrivate.checked && !cbPublic.checked) cbPublic.checked = true; // keep one on
            });
        }
    })();

    // Signup Form submission
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const phone = document.getElementById('signup-phone').value;
        const username = document.getElementById('signup-username').value;
        const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm').value;
    const visibility = (document.getElementById('visibility-private')?.checked) ? 'private' : 'public';
        
        // Client-side validations
        const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        if(!name.trim() || !email.trim() || !username.trim() || !password.trim()){
            showError('Please fill in all required fields.');
            return;
        }
        if(!emailRegex.test(email)){
            showError('Enter a valid email address.');
            return;
        }
        if(username.length < 3){
            showError('Username must be at least 3 characters.');
            return;
        }
        if(password.length < 6){
            showError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            showError('Passwords do not match!');
            return;
        }

        const submitBtn = signupForm.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';
        
        try {
            const response = await fetch(`${API_BASE_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName: name,
                    email: email,
                    phone: phone,
                    username: username,
                    password: password,
                    visibility: visibility
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Auto-login (store user + token) per requirement C
                if (data.user) localStorage.setItem('currentUser', JSON.stringify(data.user));
                if (data.token) localStorage.setItem('authToken', data.token);
                showSuccess(`Welcome, ${data.user?.username || username}! Redirecting...`);
                signupForm.reset();
                setTimeout(()=>{ window.location.href = 'feed.html'; }, 1200);
            } else {
                // Show backend-provided message or fallback
                showError(data.message || `Signup failed (${response.status}).`);
            }
        } catch (error) {
            console.error('Signup error:', error);
            showError('Network error. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });

    // College Signup submission (client-side stub)
    collegeSignupForm?.addEventListener('submit', async function(e){
        e.preventDefault();
        const submitBtn = collegeSignupForm.querySelector('.submit-btn');
        const original = submitBtn.textContent;
        if(submitBtn.dataset.submitting==='1') return;
        submitBtn.dataset.submitting='1';
        submitBtn.disabled=true; submitBtn.textContent='Creating...';
        try {
            // Early required validation (legacy form ids if still present)
            const legacyRequired = ['inst-name','inst-type','inst-year'];
            for(const id of legacyRequired){
                const el = document.getElementById(id);
                if(el && !el.value.trim()){ el.focus(); throw new Error('Fill required fields.'); }
            }
            const fd = new FormData(collegeSignupForm);
            const resp = await fetch('/api/institutions/signup', { method:'POST', body: fd });
            const data = await resp.json();
            if(!resp.ok || !data.success) throw new Error(data.message || 'Failed to create account');
            localStorage.setItem('token', data.token);
            localStorage.setItem('institution', JSON.stringify(data.institution));
            localStorage.setItem('user', JSON.stringify({ id:data.institution.id, username:data.institution.username, name:data.institution.name, accountType:'institution'}));
            alert('Institution account created! Redirecting...');
            window.location.href='feed.html';
        } catch(err){
            console.error('Institution signup error', err);
            showError(err.message || 'Institution signup failed');
        } finally {
            submitBtn.dataset.submitting='0';
            submitBtn.disabled=false; submitBtn.textContent=original;
        }
    });

    // Wizard final button (new multi-step UI) handler
    const wizardCreateBtn = document.getElementById('collegeCreateAccountBtn');
    if(wizardCreateBtn){
        wizardCreateBtn.addEventListener('click', async ()=>{
            if(wizardCreateBtn.dataset.submitting==='1') return;
            // Basic required fields check for wizard ids
            const reqIds = ['collegeName','institutionLoginEmail','institutionPassword'];
            for(const id of reqIds){
                const el = document.getElementById(id);
                if(!(el?.value?.trim())){ el?.focus(); alert('Please fill required fields.'); return; }
            }
            wizardCreateBtn.dataset.submitting='1';
            const originalText = wizardCreateBtn.textContent;
            wizardCreateBtn.disabled=true; wizardCreateBtn.textContent='Creating...';
            try {
                const fd = new FormData();
                fd.append('name', document.getElementById('collegeName')?.value.trim()||'');
                fd.append('instType', document.getElementById('collegeType')?.value.trim()||'');
                fd.append('year', document.getElementById('establishedYear')?.value.trim()||'');
                const logoInput = document.getElementById('collegeLogo');
                if(logoInput?.files?.[0]) fd.append('logo', logoInput.files[0]);
                fd.append('address', document.getElementById('collegeAddress')?.value.trim()||'');
                fd.append('city', document.getElementById('collegeCity')?.value.trim()||'');
                fd.append('state', document.getElementById('collegeState')?.value.trim()||'');
                fd.append('country', document.getElementById('collegeCountry')?.value.trim()||'');
                fd.append('zip', document.getElementById('collegeZip')?.value.trim()||'');
                fd.append('phone', document.getElementById('collegePhone')?.value.trim()||'');
                fd.append('email', document.getElementById('collegeEmail')?.value.trim()||'');
                fd.append('website', document.getElementById('collegeWebsite')?.value.trim()||'');
                // Courses
                const courseRows = document.querySelectorAll('.course-row');
                const courses=[]; courseRows.forEach(r=>{ const n=r.querySelector('.course-name'); if(n?.value?.trim()) courses.push({ name:n.value.trim(), level:r.querySelector('.course-level')?.value?.trim()||'', duration:r.querySelector('.course-duration')?.value?.trim()||'' });});
                fd.append('courses', JSON.stringify(courses));
                fd.append('head', document.getElementById('headOfInstitute')?.value.trim()||'');
                fd.append('contactName', document.getElementById('contactPerson')?.value.trim()||'');
                fd.append('contactPosition', document.getElementById('contactPosition')?.value.trim()||'');
                fd.append('contactEmail', document.getElementById('contactEmail')?.value.trim()||'');
                fd.append('contactPhone', document.getElementById('contactPhone')?.value.trim()||'');
                fd.append('loginEmail', document.getElementById('institutionLoginEmail')?.value.trim()||'');
                fd.append('password', document.getElementById('institutionPassword')?.value||'');
                fd.append('affiliations', document.getElementById('institutionAffiliations')?.value.trim()||'');
                fd.append('description', document.getElementById('institutionDescription')?.value.trim()||'');
                const docsInput = document.getElementById('verificationDocuments');
                if(docsInput?.files?.length){ Array.from(docsInput.files).forEach(f=>fd.append('docs', f)); }
                const agree = document.getElementById('institutionAgreement');
                if(agree && !agree.checked){ alert('Please agree to the terms.'); throw new Error('Agreement required'); }
                const resp = await fetch('/api/institutions/signup',{ method:'POST', body:fd });
                const data = await resp.json();
                if(!resp.ok || !data.success) throw new Error(data.message||'Failed to create account');
                localStorage.setItem('token', data.token);
                localStorage.setItem('institution', JSON.stringify(data.institution));
                localStorage.setItem('user', JSON.stringify({ id:data.institution.id, username:data.institution.username, name:data.institution.name, accountType:'institution'}));
                alert('Institution account created! Redirecting to feed...');
                window.location.href='feed.html';
            } catch(err){
                console.error('Wizard institution signup error', err);
                alert(err.message || 'Institution signup failed');
            } finally {
                wizardCreateBtn.dataset.submitting='0';
                wizardCreateBtn.disabled=false; wizardCreateBtn.textContent=originalText;
            }
        });
    }
    
    // Login Form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form values
        const loginId = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        const submitBtn = loginForm.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';
        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    loginId: loginId,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Store user + token in localStorage for authenticated requests
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                if (data.token) localStorage.setItem('authToken', data.token);
                showSuccess(`Welcome back, ${data.user.username}!`);
                
                // Clear form
                loginForm.reset();
                
                // Redirect to feed page
                setTimeout(() => {
                    window.location.href = 'feed.html';
                }, 1000);
            } else {
                showError(data.message || 'Login failed. Please try again.');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            showError('Network error. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
    
    // Social login buttons (demo)
    document.querySelectorAll('.social-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            const i = this.querySelector('i');
            let platform = 'social';
            if (i) {
                // Attempt to parse platform name from class list e.g., 'fa-facebook'
                const classes = [...i.classList];
                const fa = classes.find(c => c.startsWith('fa-') && c !== 'fa-brands');
                if (fa) platform = fa.replace('fa-', '');
            }
            alert(`Would normally redirect to ${platform} authentication`);
        });
    });
});