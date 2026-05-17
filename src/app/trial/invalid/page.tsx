export default function TrialInvalidPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#0a0c10', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ maxWidth: '480px', textAlign: 'center' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '32px' }}>
                    ⚠️
                </div>
                <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: '0 0 12px' }}>
                    Lien ket het han
                </h1>
                <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.7' }}>
                    Lien ket nay da het han hoac khong hop le.
                    Vui long lien he doi ngu MCNA de duoc ho tro.
                </p>
            </div>
        </div>
    )
}