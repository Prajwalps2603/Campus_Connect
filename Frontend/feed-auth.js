// feed-auth.js
// Handles authentication gate and user profile injection
export function getCurrentUser(){
  let currentUser = null;
  const storedUser = localStorage.getItem('currentUser');
  if(storedUser){
    try { currentUser = JSON.parse(storedUser); } catch { currentUser = null; }
  }
  return currentUser;
}

export function requireAuth(){
  const user = getCurrentUser();
  if(!user){
    window.location.href = 'index.html';
  }
  return user;
}

export function injectUserProfile(user){
  if(!user) return;
  const profileImg = document.querySelector('.user-profile img');
  if(profileImg){ profileImg.alt = `${user.username}'s profile`; }
  const firstAuthor = document.querySelector('.post .author-info h4');
  if(firstAuthor && firstAuthor.textContent.trim() === 'You'){
    firstAuthor.textContent = user.username;
  }
}
