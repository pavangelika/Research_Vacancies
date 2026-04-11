// ---------- Role Navigation Module ----------
function getActiveRoleContent(preferredRole) {
    if (preferredRole && preferredRole.classList && preferredRole.classList.contains('role-content')) return preferredRole;
    var visible = Array.from(document.querySelectorAll('.role-content')).find(function(node) {
        return (node.style.display || '') === 'block';
    });
    return visible || null;
}


