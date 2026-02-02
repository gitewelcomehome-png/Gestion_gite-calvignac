// ================================================================
// 📊 WIDGET ERREURS CRITIQUES - Dashboard
// ================================================================

window.initErrorsWidget = function() {
    const widgetHTML = `
        <div class="errors-widget" style="
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            border-radius: 12px;
            padding: 25px;
            color: white;
            margin-bottom: 20px;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; display: flex; align-items: center; gap: 10px; font-size: 20px;">
                    <i data-lucide="alert-octagon"></i>
                    Erreurs Non Résolues
                </h3>
                <button onclick="window.refreshErrorsWidget()" style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    padding: 8px 15px;
                    border-radius: 6px;
                    color: white;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.3s;
                " onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                    <i data-lucide="refresh-cw" style="width: 16px; height: 16px;"></i>
                </button>
            </div>

            <div id="errorsContainer" style="display: flex; flex-direction: column; gap: 12px;">
                <div style="text-align: center; padding: 20px;">
                    <div class="spinner" style="
                        border: 3px solid rgba(255,255,255,0.3);
                        border-top-color: white;
                        border-radius: 50%;
                        width: 30px;
                        height: 30px;
                        margin: 0 auto;
                        animation: spin 1s linear infinite;
                    "></div>
                </div>
            </div>

            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .error-card {
                    background: rgba(255,255,255,0.15);
                    backdrop-filter: blur(10px);
                    border-radius: 8px;
                    padding: 15px;
                    transition: all 0.3s;
                    border: 1px solid rgba(255,255,255,0.2);
                }
                .error-card:hover {
                    background: rgba(255,255,255,0.25);
                    transform: translateX(5px);
                }
            </style>
        </div>
    `;
    return widgetHTML;
};

window.refreshErrorsWidget = async function() {
    const container = document.getElementById('errorsContainer');
    if (!container) return;

    container.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div class="spinner" style="
                border: 3px solid rgba(255,255,255,0.3);
                border-top-color: white;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                margin: 0 auto;
                animation: spin 1s linear infinite;
            "></div>
        </div>
    `;

    try {
        const { data: errors, error } = await window.supabaseClient
            .from('v_cm_errors_unresolved')
            .select('*')
            .limit(5);

        if (error) throw error;

        if (!errors || errors.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 20px; color: rgba(255,255,255,0.9);">
                    <p style="font-size: 18px; margin: 0;">✅ Aucune erreur critique</p>
                    <p style="font-size: 14px; opacity: 0.8; margin-top: 8px;">Système stable</p>
                </div>
            `;
            return;
        }

        container.innerHTML = errors.map(err => `
            <div class="error-card" onclick="window.viewErrorDetails('${err.error_type}', '${err.source}')">
                <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 8px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                            <span style="background: rgba(255,255,255,0.3); padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase;">
                                ${err.error_type}
                            </span>
                            <span style="font-size: 14px;">${err.source}</span>
                        </div>
                        <div style="font-size: 13px; opacity: 0.9; line-height: 1.4;">
                            ${err.message.substring(0, 80)}${err.message.length > 80 ? '...' : ''}
                        </div>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; opacity: 0.8; margin-top: 10px;">
                    <span>🔄 ${err.occurrences} occurrence(s)</span>
                    <span>⏰ ${new Date(err.last_occurrence).toLocaleString('fr-FR')}</span>
                </div>
            </div>
        `).join('');

        if (window.lucide) {
            lucide.createIcons();
        }

    } catch (error) {
        console.error('❌ Erreur chargement erreurs:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: rgba(255,255,255,0.9);">
                <p>⚠️ Erreur chargement</p>
            </div>
        `;
    }
};

window.viewErrorDetails = async function(errorType, source) {
    alert(`Détails erreur:\n\nType: ${errorType}\nSource: ${source}\n\n(Module complet Monitoring dans le prochain prompt)`);
};
