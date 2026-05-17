export default function TrialSuccessPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#0a0c10', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ maxWidth: '480px', textAlign: 'center' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '32px' }}>
                    ✅
                </div>
                <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: '0 0 12px' }}>
                    Dang ky thanh cong!
                </h1>
                <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.7', margin: '0 0 32px' }}>
                    Chuc mung ban da chinh thuc dang ky khoa hoc tai MCNA.
                    Doi ngu tu van se lien he voi ban trong thoi gian som nhat.
                </p>
                <div style={{ padding: '16px 24px', background: '#0f1219', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
                    <p style={{ color: '#475569', fontSize: '13px', margin: '0' }}>
                        MCNA Education Group &nbsp;|&nbsp; E17 CRM
                    </p>
                </div>
            </div>
        </div>
    )
}