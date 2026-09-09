<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>
body{font-family:sans-serif;background:#f4f4f5;margin:0;padding:32px}
.card{background:#fff;border-radius:12px;max-width:520px;margin:0 auto;padding:40px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
h1{color:#1e293b;font-size:22px;margin:0 0 12px}
p{color:#475569;line-height:1.6;margin:0 0 16px}
.btn{display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;margin:8px 0 24px}
.info{background:#f1f5f9;border-radius:8px;padding:12px 16px;font-size:13px;color:#64748b}
</style></head>
<body>
<div class="card">
  <h1>You've been invited! 🎉</h1>
  <p>Hi{{ $inviterName ? ', ' . $inviterName . ' has invited you' : '' }} to join <strong>RIS ERP</strong>{{ $role ? ' as <strong>' . $role . '</strong>' : '' }}.</p>
  <p>Click the button below to create your account:</p>
  <a href="{{ $acceptUrl }}" class="btn">Accept Invitation</a>
  <div class="info">
    This invitation expires on <strong>{{ $expiresAt }}</strong>.<br>
    If you did not expect this email, you can safely ignore it.
  </div>
</div>
</body>
</html>
