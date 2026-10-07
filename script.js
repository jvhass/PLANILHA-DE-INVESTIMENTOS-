/* ============================================================
   INVEST+ — PERSONAL WEALTH COMMAND CENTER
   SCRIPT.JS
   Sistema de gestão pessoal de investimentos
============================================================ */


/* ============================================================
   CONFIGURAÇÃO
============================================================ */

const CONFIG = {

    storageKey: "invest_plus_joao_v1",

    goalKey: "invest_plus_goal_v1",

    themeKey: "invest_plus_theme_v1",

    currency: "BRL",

    locale: "pt-BR",

    defaults: {

        debentureRate: 1.60,

        lciRate: 92,

        nubankRate: 115,

        interRate: 100

    }

};


/* ============================================================
   ESTADO INICIAL
============================================================ */

const DEFAULT_INVESTMENTS = [

    {
        id: generateId(),

        institution: "FOCO Securitizadora",

        name: "4ª Emissão — 05ª Série",

        type: "Renda Fixa",

        indexer: "Prefixado",

        rate: 1.60,

        liquidity: "Diária",

        date: "2026-08-05",

        invested: 5000,

        current: 5150.37,

        income: 150.37,

        ir: 81.11,

        iof: 0,

        maturity: "",

        notes: "Debênture • Lote 1 • 1,6% a.m."

    },

    {

        id: generateId(),

        institution: "FOCO Securitizadora",

        name: "4ª Emissão — 05ª Série",

        type: "Renda Fixa",

        indexer: "Prefixado",

        rate: 1.60,

        liquidity: "Diária",

        date: "2026-09-01",

        invested: 1000,

        current: 1015.46,

        income: 15.46,

        ir: 15.46,

        iof: 0,

        maturity: "",

        notes: "Debênture • Lote 2 • 1,6% a.m."

    },

    {

        id: generateId(),

        institution: "Nubank",

        name: "Caixinha Turbo",

        type: "Renda Fixa",

        indexer: "CDI",

        rate: 115,

        liquidity: "Diária",

        date: "",

        invested: 1688.25,

        current: 1688.25,

        income: 0,

        ir: 0,

        iof: 0,

        maturity: "",

        notes: "115% do CDI"

    },

    {

        id: generateId(),

        institution: "Banco Inter",

        name: "LCI Liquidez 6 meses",

        type: "Renda Fixa",

        indexer: "CDI",

        rate: 92,

        liquidity: "6 meses",

        date: "2026-06-19",

        invested: 300,

        current: 310.71,

        income: 10.71,

        ir: 0,

        iof: 0,

        maturity: "2026-12-19",

        notes: "92% do CDI • sem IR/IOF informado"

    },

    {

        id: generateId(),

        institution: "Banco Inter",

        name: "Aplicação 100% CDI",

        type: "Renda Fixa",

        indexer: "CDI",

        rate: 100,

        liquidity: "Diária",

        date: "",

        invested: 170.34,

        current: 170.34,

        income: 0,

        ir: 0,

        iof: 0,

        maturity: "",

        notes: "100% do CDI"

    }

];


/* ============================================================
   ESTADO
============================================================ */

let investments = loadInvestments();

let goal = loadGoal();

let chartAllocation = null;

let chartEvolution = null;


/* ============================================================
   INICIALIZAÇÃO
============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    initializeApplication();

});


function initializeApplication() {

    setupNavigation();

    setupModal();

    setupForms();

    setupFilters();

    setupButtons();

    setupGoal();

    setupSimulator();

    renderEverything();

}


/* ============================================================
   STORAGE
============================================================ */

function loadInvestments() {

    try {

        const saved =
            localStorage.getItem(CONFIG.storageKey);

        if (!saved) {

            localStorage.setItem(
                CONFIG.storageKey,
                JSON.stringify(DEFAULT_INVESTMENTS)
            );

            return [...DEFAULT_INVESTMENTS];

        }

        const parsed = JSON.parse(saved);

        if (!Array.isArray(parsed)) {

            return [...DEFAULT_INVESTMENTS];

        }

        return parsed;

    }

    catch (error) {

        console.error(
            "Erro ao carregar investimentos:",
            error
        );

        return [...DEFAULT_INVESTMENTS];

    }

}


function saveInvestments() {

    localStorage.setItem(

        CONFIG.storageKey,

        JSON.stringify(investments)

    );

}


function loadGoal() {

    try {

        const saved =
            localStorage.getItem(CONFIG.goalKey);

        if (!saved) {

            return {

                target: 10000,

                description: "Primeira meta patrimonial"

            };

        }

        return JSON.parse(saved);

    }

    catch {

        return {

            target: 10000,

            description: "Primeira meta patrimonial"

        };

    }

}


function saveGoal() {

    localStorage.setItem(

        CONFIG.goalKey,

        JSON.stringify(goal)

    );

}


/* ============================================================
   UTILITÁRIOS
============================================================ */

function generateId() {

    return (

        Date.now().toString(36) +

        Math.random()
            .toString(36)
            .substring(2, 9)

    );

}


function number(value) {

    if (typeof value === "number") {

        return Number.isFinite(value)
            ? value
            : 0;

    }

    if (!value) {

        return 0;

    }

    let clean = String(value)
        .replace(/[R$\s]/g, "")
        .replace(/\./g, "")
        .replace(",", ".");

    const parsed = parseFloat(clean);

    return Number.isFinite(parsed)
        ? parsed
        : 0;

}


function formatMoney(value) {

    return new Intl.NumberFormat(

        CONFIG.locale,

        {

            style: "currency",

            currency: CONFIG.currency,

            minimumFractionDigits: 2,

            maximumFractionDigits: 2

        }

    ).format(number(value));

}


function formatPercent(value, decimals = 2) {

    return (

        number(value)
            .toFixed(decimals)
            .replace(".", ",")

        + "%"

    );

}


function formatDate(date) {

    if (!date) {

        return "—";

    }

    const d = new Date(date + "T12:00:00");

    if (Number.isNaN(d.getTime())) {

        return "—";

    }

    return d.toLocaleDateString(
        CONFIG.locale
    );

}


function escapeHTML(value) {

    return String(value ?? "")

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


/* ============================================================
   CÁLCULOS DA CARTEIRA
============================================================ */

function calculatePortfolio() {

    const totalInvested = investments.reduce(

        (sum, item) =>
            sum + number(item.invested),

        0

    );


    const totalCurrent = investments.reduce(

        (sum, item) =>
            sum + number(item.current),

        0

    );


    const totalIncome = investments.reduce(

        (sum, item) =>
            sum +

            (

                number(item.current) -
                number(item.invested)

            ),

        0

    );


    const totalReportedIncome =
        investments.reduce(

            (sum, item) =>
                sum + number(item.income),

            0

        );


    const totalIR = investments.reduce(

        (sum, item) =>
            sum + number(item.ir),

        0

    );


    const totalIOF = investments.reduce(

        (sum, item) =>
            sum + number(item.iof),

        0

    );


    const profitability = totalInvested > 0

        ? totalIncome / totalInvested * 100

        : 0;


    const allocation = investments
        .filter(item => number(item.current) > 0)
        .map(item => ({

            ...item,

            weight:
                totalCurrent > 0

                    ? number(item.current)
                        / totalCurrent
                        * 100

                    : 0

        }));


    return {

        totalInvested,

        totalCurrent,

        totalIncome,

        totalReportedIncome,

        totalIR,

        totalIOF,

        profitability,

        allocation

    };

}


/* ============================================================
   HEALTH SCORE
============================================================ */

function calculateHealthScore() {

    if (!investments.length) {

        return 0;

    }


    const portfolio =
        calculatePortfolio();


    let score = 50;


    /* Diversificação */

    const uniqueInstitutions =
        new Set(

            investments.map(
                item => item.institution
            )

        ).size;


    score += Math.min(
        uniqueInstitutions * 5,
        15
    );


    /* Liquidez */

    const dailyLiquidity =
        investments.filter(

            item =>
                String(item.liquidity)
                    .toLowerCase()
                    .includes("diária")

        );


    if (dailyLiquidity.length > 0) {

        score += 10;

    }


    /* Rentabilidade */

    if (portfolio.profitability > 0) {

        score += Math.min(
            portfolio.profitability * 2,
            10
        );

    }


    /* Concentração */

    const largestPosition =
        Math.max(

            ...portfolio.allocation
                .map(item => item.weight),

            0

        );


    if (largestPosition > 70) {

        score -= 20;

    }

    else if (largestPosition > 50) {

        score -= 10;

    }


    if (score > 100) {

        score = 100;

    }


    if (score < 0) {

        score = 0;

    }


    return Math.round(score);

}


/* ============================================================
   ASSESSORA — INSIGHTS
============================================================ */

function generateInsights() {

    const portfolio =
        calculatePortfolio();


    const insights = [];


    if (!investments.length) {

        insights.push({

            type: "info",

            icon: "fa-lightbulb",

            title: "Comece sua carteira",

            text:
                "Adicione seu primeiro investimento para ativar a análise automática."

        });

        return insights;

    }


    /* Patrimônio */

    insights.push({

        type: "good",

        icon: "fa-chart-line",

        title: "Patrimônio acompanhado",

        text:

            `Sua carteira possui ${formatMoney(
                portfolio.totalCurrent
            )} em valor atual.`

    });


    /* Maior posição */

    const largest =
        [...portfolio.allocation]

            .sort(
                (a, b) =>
                    b.weight - a.weight
            )[0];


    if (largest) {

        if (largest.weight > 60) {

            insights.push({

                type: "warning",

                icon: "fa-triangle-exclamation",

                title: "Concentração elevada",

                text:

                    `${largest.name} representa ${formatPercent(
                        largest.weight,
                        1
                    )} da carteira. Vale acompanhar esse peso.`

            });

        }

        else {

            insights.push({

                type: "good",

                icon: "fa-shield-halved",

                title: "Concentração controlada",

                text:

                    `Sua maior posição representa ${formatPercent(
                        largest.weight,
                        1
                    )} da carteira.`

            });

        }

    }


    /* Liquidez */

    const dailyValue =
        investments

            .filter(item =>
                String(item.liquidity)
                    .toLowerCase()
                    .includes("diária")
            )

            .reduce(
                (sum, item) =>
                    sum + number(item.current),
                0
            );


    const liquidityPercent =
        portfolio.totalCurrent > 0

            ? dailyValue /
              portfolio.totalCurrent *
              100

            : 0;


    insights.push({

        type:
            liquidityPercent >= 20
                ? "good"
                : "warning",

        icon: "fa-droplet",

        title: "Liquidez",

        text:

            `${formatPercent(
                liquidityPercent,
                1
            )} do patrimônio está em posições marcadas como liquidez diária.`

    });


    /* Rentabilidade */

    if (portfolio.profitability > 0) {

        insights.push({

            type: "good",

            icon: "fa-arrow-trend-up",

            title: "Carteira positiva",

            text:

                `O ganho calculado sobre os valores informados é de ${formatMoney(
                    portfolio.totalIncome
                )}.`

        });

    }


    /* Vencimento */

    const upcoming =
        getUpcomingMaturities();


    if (upcoming.length) {

        const next =
            upcoming[0];


        insights.push({

            type: "info",

            icon: "fa-calendar",

            title: "Vencimento próximo",

            text:

                `${next.name} possui vencimento em ${formatDate(
                    next.maturity
                )}.`

        });

    }


    return insights.slice(0, 5);

}


/* ============================================================
   RENDER GERAL
============================================================ */

function renderEverything() {

    saveInvestments();

    renderKPIs();

    renderInvestmentTable();

    renderPreview();

    renderInsights();

    renderAdvisor();

    renderGoal();

    renderMaturities();

    renderCharts();

    updateInvestmentCount();

}


/* ============================================================
   KPI
============================================================ */

function renderKPIs() {

    const portfolio =
        calculatePortfolio();


    setText(
        [
            "#totalPatrimony",
            "#patrimonyValue",
            "[data-kpi='patrimony']"
        ],
        formatMoney(
            portfolio.totalCurrent
        )
    );


    setText(
        [
            "#totalInvested",
            "#investedValue",
            "[data-kpi='invested']"
        ],
        formatMoney(
            portfolio.totalInvested
        )
    );


    setText(
        [
            "#totalProfit",
            "#profitValue",
            "[data-kpi='profit']"
        ],
        formatMoney(
            portfolio.totalIncome
        )
    );


    setText(
        [
            "#totalReturn",
            "#returnValue",
            "[data-kpi='return']"
        ],
        formatPercent(
            portfolio.profitability
        )
    );

}


function setText(selectors, value) {

    selectors.forEach(selector => {

        const elements =
            document.querySelectorAll(
                selector
            );

        elements.forEach(element => {

            element.textContent = value;

        });

    });

}


/* ============================================================
   TABELA
============================================================ */

function renderInvestmentTable(list = investments) {

    const tbody =
        document.querySelector(
            "#investmentTableBody"
        ) ||
        document.querySelector(
            "#investmentsTableBody"
        ) ||
        document.querySelector(
            "tbody[data-investments]"
        );


    if (!tbody) {

        return;

    }


    if (!list.length) {

        tbody.innerHTML = `

            <tr>

                <td colspan="20">

                    <div class="empty-state">

                        <i class="fa-solid fa-wallet"></i>

                        <strong>
                            Nenhum investimento encontrado
                        </strong>

                        <span>
                            Cadastre um investimento para começar.
                        </span>

                    </div>

                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        list.map(item => {

            const profit =
                number(item.current) -
                number(item.invested);


            const returnPercent =
                number(item.invested) > 0

                    ? profit /
                      number(item.invested) *
                      100

                    : 0;


            return `

                <tr data-id="${escapeHTML(item.id)}">

                    <td>

                        <div class="investment-name">

                            <div class="investment-logo">

                                <i class="fa-solid fa-building-columns"></i>

                            </div>

                            <div>

                                <strong>
                                    ${escapeHTML(item.name)}
                                </strong>

                                <small>
                                    ${escapeHTML(item.institution)}
                                </small>

                            </div>

                        </div>

                    </td>


                    <td>
                        ${escapeHTML(item.indexer)}
                    </td>


                    <td class="rate">

                        ${
                            item.indexer === "Prefixado"

                                ? formatPercent(item.rate)

                                : `${formatPercent(item.rate, 0)} CDI`

                        }

                    </td>


                    <td>

                        <span class="liquidity-tag">

                            ${escapeHTML(
                                item.liquidity || "—"
                            )}

                        </span>

                    </td>


                    <td>
                        ${formatMoney(item.current)}
                    </td>


                    <td class="${
                        profit >= 0
                            ? "positive"
                            : "negative"
                    }">

                        ${
                            profit >= 0
                                ? "+"
                                : ""
                        }

                        ${formatMoney(profit)}

                    </td>


                    <td class="${
                        returnPercent >= 0
                            ? "positive"
                            : "negative"
                    }">

                        ${
                            returnPercent >= 0
                                ? "+"
                                : ""
                        }

                        ${formatPercent(
                            returnPercent
                        )}

                    </td>


                    <td>

                        <button

                            class="action-button"

                            title="Excluir investimento"

                            onclick="deleteInvestment('${escapeHTML(
                                item.id
                            )}')"

                        >

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </td>

                </tr>

            `;

        }).join("");

}


/* ============================================================
   PREVIEW
============================================================ */

function renderPreview() {

    const container =
        document.querySelector(
            "#investmentPreview"
        );


    if (!container) {

        return;

    }


    const list =
        [...investments]

            .sort(
                (a,b) =>
                    number(b.current) -
                    number(a.current)
            )

            .slice(0,4);


    container.innerHTML =
        list.map(item => {

            const profit =
                number(item.current) -
                number(item.invested);


            return `

                <div class="preview-card">

                    <small>
                        ${escapeHTML(
                            item.institution
                        )}
                    </small>

                    <strong>
                        ${escapeHTML(
                            item.name
                        )}
                    </strong>

                    <span>

                        ${
                            profit >= 0
                                ? "+"
                                : ""
                        }

                        ${formatMoney(profit)}

                    </span>

                </div>

            `;

        }).join("");

}


/* ============================================================
   INSIGHTS
============================================================ */

function renderInsights() {

    const container =
        document.querySelector(
            "#insights"
        ) ||
        document.querySelector(
            ".insights"
        );


    if (!container) {

        return;

    }


    const insights =
        generateInsights();


    container.innerHTML =
        insights.map(item => `

            <div class="insight ${item.type}">

                <div class="insight-icon">

                    <i class="fa-solid fa-${item.icon
                        .replace("fa-","")}"></i>

                </div>

                <div>

                    <strong>
                        ${escapeHTML(item.title)}
                    </strong>

                    <p>
                        ${escapeHTML(item.text)}
                    </p>

                </div>

            </div>

        `).join("");

}


/* ============================================================
   ADVISOR
============================================================ */

function renderAdvisor() {

    const score =
        calculateHealthScore();


    setText(

        [
            "#healthScore",
            "#advisorScore",
            "[data-health-score]"
        ],

        score

    );


    const message =
        document.querySelector(
            "#advisorMessage"
        ) ||
        document.querySelector(
            ".advisor-message p"
        );


    if (message) {

        if (score >= 85) {

            message.textContent =
                "Sua carteira apresenta uma estrutura muito boa. Continue acompanhando concentração, liquidez e evolução patrimonial.";

        }

        else if (score >= 70) {

            message.textContent =
                "Sua carteira está bem encaminhada. Existem alguns pontos que podem ser melhorados conforme seu patrimônio crescer.";

        }

        else if (score >= 50) {

            message.textContent =
                "Sua carteira está em desenvolvimento. A prioridade agora é acompanhar concentração, liquidez e diversificação.";

        }

        else {

            message.textContent =
                "A carteira precisa de atenção. Revise concentração, liquidez e distribuição dos investimentos.";

        }

    }


    renderRadar(score);

}


function renderRadar() {

    const portfolio =
        calculatePortfolio();


    const positions =
        portfolio.allocation.length;


    const diversification =
        Math.min(
            100,
            positions * 20
        );


    const liquidity =
        investments.filter(item =>

            String(item.liquidity)
                .toLowerCase()
                .includes("diária")

        ).length;


    const liquidityScore =
        investments.length > 0

            ? Math.round(
                liquidity /
                investments.length *
                100
            )

            : 0;


    const concentration =
        portfolio.allocation.length

            ? 100 -
              Math.max(
                ...portfolio.allocation
                    .map(item => item.weight)
              )

            : 0;


    const profitability =
        portfolio.profitability > 0

            ? Math.min(
                100,
                50 +
                portfolio.profitability * 10
            )

            : 50;


    const values = {

        "#diversificationScore":
            diversification,

        "#liquidityScore":
            liquidityScore,

        "#concentrationScore":
            Math.round(concentration),

        "#profitabilityScore":
            Math.round(profitability)

    };


    Object.entries(values).forEach(

        ([selector, value]) => {

            const el =
                document.querySelector(
                    selector
                );


            if (el) {

                el.textContent =
                    `${value}%`;

            }


            const bar =
                document.querySelector(
                    `${selector}Bar`
                );


            if (bar) {

                bar.style.width =
                    `${value}%`;

            }

        }

    );

}


/* ============================================================
   NAVEGAÇÃO
============================================================ */

function setupNavigation() {

    const buttons =
        document.querySelectorAll(
            ".nav-item"
        );


    const pages =
        document.querySelectorAll(
            ".page"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const target =
                    button.dataset.page ||
                    button.dataset.target;


                if (!target) {

                    return;

                }


                buttons.forEach(btn =>

                    btn.classList.remove(
                        "active"
                    )

                );


                button.classList.add(
                    "active"
                );


                pages.forEach(page => {

                    page.classList.remove(
                        "active"
                    );

                });


                const targetPage =
                    document.getElementById(
                        target
                    );


                if (targetPage) {

                    targetPage.classList.add(
                        "active"
                    );

                }


                window.scrollTo({

                    top: 0,

                    behavior: "smooth"

                });

            }

        );

    });

}


/* ============================================================
   MODAL
============================================================ */

function setupModal() {

    const modal =
        document.querySelector(
            "#investmentModal"
        ) ||
        document.querySelector(
            ".modal"
        );


    if (!modal) {

        return;

    }


    const closeButtons =
        modal.querySelectorAll(
            ".modal-close, [data-close-modal]"
        );


    closeButtons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                closeModal(modal);

            }

        );

    });


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeModal(modal);

            }

        }

    );

}


function openInvestmentModal() {

    const modal =
        document.querySelector(
            "#investmentModal"
        ) ||
        document.querySelector(
            ".modal"
        );


    if (modal) {

        modal.classList.add("show");

    }

}


function closeModal(modal = null) {

    const target =
        modal ||
        document.querySelector(
            "#investmentModal"
        ) ||
        document.querySelector(
            ".modal"
        );


    if (target) {

        target.classList.remove(
            "show"
        );

    }

}


/* ============================================================
   FORMULÁRIO DE INVESTIMENTO
============================================================ */

function setupForms() {

    const form =
        document.querySelector(
            "#investmentForm"
        );


    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const data =
                new FormData(form);


            const investment = {

                id: generateId(),

                institution:
                    data.get("institution") ||
                    getValue(form, [
                        "#institution",
                        "[name='institution']"
                    ]),

                name:
                    data.get("name") ||
                    getValue(form, [
                        "#investmentName",
                        "#name",
                        "[name='name']"
                    ]),

                type:
                    data.get("type") ||
                    getValue(form, [
                        "#type",
                        "[name='type']"
                    ]) ||
                    "Renda Fixa",

                indexer:
                    data.get("indexer") ||
                    getValue(form, [
                        "#indexer",
                        "[name='indexer']"
                    ]) ||
                    "CDI",

                rate:
                    number(
                        data.get("rate") ||
                        getValue(form, [
                            "#rate",
                            "[name='rate']"
                        ])
                    ),

                liquidity:
                    data.get("liquidity") ||
                    getValue(form, [
                        "#liquidity",
                        "[name='liquidity']"
                    ]),

                date:
                    data.get("date") ||
                    getValue(form, [
                        "#date",
                        "[name='date']"
                    ]),

                invested:
                    number(
                        data.get("invested") ||
                        getValue(form, [
                            "#invested",
                            "#amount",
                            "[name='invested']"
                        ])
                    ),

                current:
                    number(
                        data.get("current") ||
                        getValue(form, [
                            "#current",
                            "#currentValue",
                            "[name='current']"
                        ])
                    ),

                income:
                    number(
                        data.get("income") ||
                        getValue(form, [
                            "#income",
                            "[name='income']"
                        ])
                    ),

                ir:
                    number(
                        data.get("ir") ||
                        getValue(form, [
                            "#ir",
                            "[name='ir']"
                        ])
                    ),

                iof:
                    number(
                        data.get("iof") ||
                        getValue(form, [
                            "#iof",
                            "[name='iof']"
                        ])
                    ),

                maturity:
                    data.get("maturity") ||
                    getValue(form, [
                        "#maturity",
                        "[name='maturity']"
                    ]),

                notes:
                    data.get("notes") ||
                    getValue(form, [
                        "#notes",
                        "[name='notes']"
                    ])

            };


            if (!investment.name) {

                showToast(
                    "Informe o nome do investimento."
                );

                return;

            }


            if (
                investment.invested <= 0
            ) {

                showToast(
                    "Informe um valor aplicado válido."
                );

                return;

            }


            if (
                investment.current <= 0
            ) {

                investment.current =
                    investment.invested;

            }


            if (
                !investment.income
            ) {

                investment.income =
                    investment.current -
                    investment.invested;

            }


            investments.push(
                investment
            );


            saveInvestments();

            renderEverything();

            form.reset();

            closeModal();

            showToast(
                "Investimento adicionado com sucesso."
            );

        }

    );

}


function getValue(form, selectors) {

    for (const selector of selectors) {

        const element =
            form.querySelector(
                selector
            );


        if (element) {

            return element.value;

        }

    }


    return "";

}


/* ============================================================
   EXCLUSÃO
============================================================ */

function deleteInvestment(id) {

    const item =
        investments.find(
            investment =>
                investment.id === id
        );


    if (!item) {

        return;

    }


    const confirmed =
        confirm(

            `Excluir "${item.name}" da carteira?`

        );


    if (!confirmed) {

        return;

    }


    investments =
        investments.filter(
            investment =>
                investment.id !== id
        );


    saveInvestments();

    renderEverything();

    showToast(
        "Investimento removido."
    );

}


/* ============================================================
   FILTROS
============================================================ */

function setupFilters() {

    const search =
        document.querySelector(
            "#investmentSearch"
        ) ||
        document.querySelector(
            "[data-search-investments]"
        );


    const type =
        document.querySelector(
            "#investmentFilter"
        ) ||
        document.querySelector(
            "[data-filter-type]"
        );


    const indexer =
        document.querySelector(
            "#indexerFilter"
        ) ||
        document.querySelector(
            "[data-filter-indexer]"
        );


    [search, type, indexer]
        .filter(Boolean)
        .forEach(element => {

            element.addEventListener(
                "input",
                applyFilters
            );

            element.addEventListener(
                "change",
                applyFilters
            );

        });

}


function applyFilters() {

    const search =
        document.querySelector(
            "#investmentSearch"
        )?.value
        ?.toLowerCase()
        .trim() || "";


    const type =
        document.querySelector(
            "#investmentFilter"
        )?.value || "";


    const indexer =
        document.querySelector(
            "#indexerFilter"
        )?.value || "";


    const filtered =
        investments.filter(item => {

            const searchable = [

                item.name,

                item.institution,

                item.type,

                item.indexer,

                item.notes

            ]

                .join(" ")

                .toLowerCase();


            const matchesSearch =
                !search ||
                searchable.includes(
                    search
                );


            const matchesType =
                !type ||
                item.type === type;


            const matchesIndexer =
                !indexer ||
                item.indexer === indexer;


            return (

                matchesSearch &&
                matchesType &&
                matchesIndexer

            );

        });


    renderInvestmentTable(
        filtered
    );

}


/* ============================================================
   BOTÕES
============================================================ */

function setupButtons() {

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-action]"
                );


            if (!button) {

                return;

            }


            const action =
                button.dataset.action;


            if (
                action ===
                "add-investment"
            ) {

                openInvestmentModal();

            }


            if (
                action ===
                "refresh"
            ) {

                renderEverything();

                showToast(
                    "Carteira atualizada."
                );

            }


            if (
                action ===
                "export"
            ) {

                exportInvestments();

            }


            if (
                action ===
                "clear-data"
            ) {

                resetPortfolio();

            }

        }

    );

}


/* ============================================================
   EXPORTAÇÃO CSV
============================================================ */

function exportInvestments() {

    if (!investments.length) {

        showToast(
            "Não há investimentos para exportar."
        );

        return;

    }


    const headers = [

        "Instituição",

        "Investimento",

        "Tipo",

        "Indexador",

        "Taxa",

        "Liquidez",

        "Data",

        "Aplicado",

        "Valor Atual",

        "Rendimento",

        "IR",

        "IOF",

        "Vencimento",

        "Observações"

    ];


    const rows =
        investments.map(item => [

            item.institution,

            item.name,

            item.type,

            item.indexer,

            item.rate,

            item.liquidity,

            item.date,

            item.invested,

            item.current,

            item.income,

            item.ir,

            item.iof,

            item.maturity,

            item.notes

        ]);


    const csv = [

        headers,

        ...rows

    ]

        .map(row =>

            row.map(value =>

                `"${String(value ?? "")
                    .replace(/"/g, '""')}"`

            ).join(";")

        )

        .join("\n");


    const blob =
        new Blob(
            ["\ufeff" + csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        "minha-carteira-investimentos.csv";


    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);


    showToast(
        "Carteira exportada."
    );

}


/* ============================================================
   RESET
============================================================ */

function resetPortfolio() {

    const confirmed =
        confirm(

            "Isso irá restaurar a carteira inicial. Continuar?"

        );


    if (!confirmed) {

        return;

    }


    investments =
        DEFAULT_INVESTMENTS.map(
            item => ({
                ...item,
                id: generateId()
            })
        );


    saveInvestments();

    renderEverything();

    showToast(
        "Carteira restaurada."
    );

}


/* ============================================================
   METAS
============================================================ */

function setupGoal() {

    const form =
        document.querySelector(
            "#goalForm"
        );


    if (!form) {

        renderGoal();

        return;

    }


    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const target =
                number(

                    form.querySelector(
                        "#goalTarget"
                    )?.value

                );


            const description =
                form.querySelector(
                    "#goalDescription"
                )?.value ||
                "Meta patrimonial";


            if (target <= 0) {

                showToast(
                    "Informe uma meta válida."
                );

                return;

            }


            goal = {

                target,

                description

            };


            saveGoal();

            renderGoal();

            showToast(
                "Meta atualizada."
            );

        }

    );


    renderGoal();

}


function renderGoal() {

    const portfolio =
        calculatePortfolio();


    const percentage =
        goal.target > 0

            ? Math.min(

                100,

                portfolio.totalCurrent /
                goal.target *
                100

            )

            : 0;


    setText(

        [
            "#goalCurrent",
            "[data-goal-current]"
        ],

        formatMoney(
            portfolio.totalCurrent
        )

    );


    setText(

        [
            "#goalTargetDisplay",
            "[data-goal-target]"
        ],

        formatMoney(
            goal.target
        )

    );


    setText(

        [
            "#goalPercent",
            "[data-goal-percent]"
        ],

        formatPercent(
            percentage,
            1
        )

    );


    setText(

        [
            "#goalDescription",
            "[data-goal-description]"
        ],

        goal.description

    );


    const progressBars =
        document.querySelectorAll(
            ".progress-bar div"
        );


    progressBars.forEach(
        bar => {

            bar.style.width =
                `${percentage}%`;

        }
    );

}


/* ============================================================
   VENCIMENTOS
============================================================ */

function getUpcomingMaturities() {

    const today =
        new Date();


    return investments

        .filter(item => {

            if (!item.maturity) {

                return false;

            }


            const maturity =
                new Date(
                    item.maturity +
                    "T12:00:00"
                );


            return maturity >= today;

        })

        .sort(

            (a,b) =>

                new Date(
                    a.maturity
                ) -

                new Date(
                    b.maturity
                )

        );

}


function daysUntil(date) {

    const today =
        new Date();


    today.setHours(
        0,0,0,0
    );


    const target =
        new Date(
            date + "T00:00:00"
        );


    return Math.ceil(

        (
            target -
            today
        ) /

        (
            1000 *
            60 *
            60 *
            24
        )

    );

}


function renderMaturities() {

    const container =
        document.querySelector(
            "#maturityList"
        ) ||
        document.querySelector(
            ".calendar-list"
        );


    if (!container) {

        return;

    }


    const maturities =
        getUpcomingMaturities();


    if (!maturities.length) {

        container.innerHTML = `

            <div class="empty-state">

                <i class="fa-regular fa-calendar"></i>

                <strong>
                    Nenhum vencimento cadastrado
                </strong>

                <span>
                    Adicione datas de vencimento aos investimentos.
                </span>

            </div>

        `;

        return;

    }


    container.innerHTML =
        maturities.map(item => {

            const date =
                new Date(
                    item.maturity +
                    "T12:00:00"
                );


            const days =
                daysUntil(
                    item.maturity
                );


            return `

                <div class="maturity-card glass">

                    <div class="maturity-date">

                        <strong>
                            ${String(
                                date.getDate()
                            ).padStart(2,"0")}
                        </strong>

                        <span>
                            ${date.toLocaleDateString(
                                "pt-BR",
                                {
                                    month:
                                        "short"
                                }
                            )}
                        </span>

                    </div>


                    <div class="maturity-info">

                        <strong>
                            ${escapeHTML(
                                item.name
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                item.institution
                            )}
                            •
                            ${formatMoney(
                                item.current
                            )}
                        </span>

                    </div>


                    <div class="maturity-days">

                        ${
                            days === 0
                                ? "HOJE"
                                : `${days} dias`
                        }

                    </div>

                </div>

            `;

        }).join("");

}


/* ============================================================
   SIMULADOR
============================================================ */

function setupSimulator() {

    const form =
        document.querySelector(
            "#simulatorForm"
        );


    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            calculateSimulation();

        }

    );


    [

        "#simInitial",

        "#simMonthly",

        "#simRate",

        "#simMonths"

    ].forEach(selector => {

        const el =
            document.querySelector(
                selector
            );


        if (el) {

            el.addEventListener(
                "input",
                calculateSimulation
            );

        }

    });


    calculateSimulation();

}


function calculateSimulation() {

    const initial =
        number(
            document.querySelector(
                "#simInitial"
            )?.value
        );


    const monthly =
        number(
            document.querySelector(
                "#simMonthly"
            )?.value
        );


    const annualRate =
        number(
            document.querySelector(
                "#simRate"
            )?.value
        );


    const months =
        number(
            document.querySelector(
                "#simMonths"
            )?.value
        );


    if (
        !months ||
        months <= 0
    ) {

        return;

    }


    const monthlyRate =

        Math.pow(

            1 +
            annualRate / 100,

            1 / 12

        ) - 1;


    let balance = initial;


    let totalContributed =
        initial;


    for (
        let month = 1;
        month <= months;
        month++
    ) {

        balance =
            balance *
            (1 + monthlyRate);


        balance += monthly;


        totalContributed +=
            monthly;

    }


    const profit =
        balance -
        totalContributed;


    setText(

        [
            "#simulationResult",
            "[data-simulation-result]"
        ],

        formatMoney(balance)

    );


    setText(

        [
            "#simulationContributed",
            "[data-simulation-contributed]"
        ],

        formatMoney(
            totalContributed
        )

    );


    setText(

        [
            "#simulationProfit",
            "[data-simulation-profit]"
        ],

        formatMoney(
            profit
        )

    );


    setText(

        [
            "#simulationRate",
            "[data-simulation-rate]"
        ],

        formatPercent(
            annualRate
        )

    );

}


/* ============================================================
   GRÁFICOS
============================================================ */

function renderCharts() {

    if (
        typeof Chart ===
        "undefined"
    ) {

        return;

    }


    renderAllocationChart();

    renderEvolutionChart();

}


function renderAllocationChart() {

    const canvas =
        document.querySelector(
            "#allocationChart"
        );


    if (!canvas) {

        return;

    }


    const data =
        buildAllocationData();


    if (chartAllocation) {

        chartAllocation.destroy();

    }


    chartAllocation =
        new Chart(

            canvas.getContext("2d"),

            {

                type: "doughnut",

                data: {

                    labels:
                        data.labels,

                    datasets: [

                        {

                            data:
                                data.values,

                            borderWidth: 0,

                            backgroundColor: [

                                "#22d3ee",

                                "#38bdf8",

                                "#8b5cf6",

                                "#a855f7",

                                "#34d399",

                                "#fbbf24",

                                "#fb7185",

                                "#60a5fa",

                                "#818cf8",

                                "#2dd4bf"

                            ]

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    cutout: "72%",

                    plugins: {

                        legend: {

                            position: "bottom",

                            labels: {

                                color:
                                    "#a5b1c4",

                                padding: 15,

                                font: {

                                    size: 10

                                }

                            }

                        },

                        tooltip: {

                            callbacks: {

                                label:
                                    context => {

                                        return (

                                            " " +

                                            context.label +

                                            ": " +

                                            formatMoney(
                                                context.raw
                                            )

                                        );

                                    }

                            }

                        }

                    }

                }

            }

        );

}


function buildAllocationData() {

    const grouped = {};


    investments.forEach(item => {

        const key =
            item.name ||
            "Sem nome";


        grouped[key] =
            (grouped[key] || 0) +

            number(item.current);

    });


    const entries =
        Object.entries(grouped)

            .sort(
                (a,b) =>
                    b[1] - a[1]
            );


    return {

        labels:
            entries.map(
                entry => entry[0]
            ),

        values:
            entries.map(
                entry => entry[1]
            )

    };

}


function renderEvolutionChart() {

    const canvas =
        document.querySelector(
            "#evolutionChart"
        );


    if (!canvas) {

        return;

    }


    if (chartEvolution) {

        chartEvolution.destroy();

    }


    const portfolio =
        calculatePortfolio();


    const invested =
        portfolio.totalInvested;


    const current =
        portfolio.totalCurrent;


    chartEvolution =
        new Chart(

            canvas.getContext("2d"),

            {

                type: "line",

                data: {

                    labels: [

                        "Capital aplicado",

                        "Valor atual"

                    ],

                    datasets: [

                        {

                            label:
                                "Patrimônio",

                            data: [

                                invested,

                                current

                            ],

                            borderColor:
                                "#22d3ee",

                            backgroundColor:
                                "rgba(34,211,238,0.08)",

                            fill: true,

                            tension: 0.4,

                            pointBackgroundColor:
                                "#22d3ee",

                            pointBorderWidth:
                                0,

                            pointRadius:
                                5

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {

                            display: false

                        }

                    },

                    scales: {

                        x: {

                            grid: {

                                color:
                                    "rgba(255,255,255,0.04)"

                            },

                            ticks: {

                                color:
                                    "#65748a",

                                font: {

                                    size: 9

                                }

                            }

                        },

                        y: {

                            grid: {

                                color:
                                    "rgba(255,255,255,0.04)"

                            },

                            ticks: {

                                color:
                                    "#65748a",

                                font: {

                                    size: 9

                                },

                                callback:
                                    value =>
                                        formatMoney(
                                            value
                                        )

                            }

                        }

                    }

                }

            }

        );

}


/* ============================================================
   CONTADOR
============================================================ */

function updateInvestmentCount() {

    setText(

        [
            "#investmentCount",
            "[data-investment-count]"
        ],

        investments.length

    );

}


/* ============================================================
   TOAST
============================================================ */

function showToast(message) {

    const oldToast =
        document.querySelector(
            ".toast"
        );


    if (oldToast) {

        oldToast.remove();

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "toast";


    toast.innerHTML = `

        <i class="fa-solid fa-circle-check"></i>

        <span>
            ${escapeHTML(message)}
        </span>

    `;


    document.body.appendChild(
        toast
    );


    setTimeout(() => {

        toast.style.opacity = "0";

        toast.style.transform =
            "translateY(10px)";

        setTimeout(
            () => toast.remove(),
            300
        );

    }, 2800);

}


/* ============================================================
   ATUALIZAÇÃO AUTOMÁTICA
============================================================ */

window.addInvestment = function(data) {

    if (!data) {

        return;

    }


    investments.push({

        id: generateId(),

        institution:
            data.institution || "",

        name:
            data.name || "Novo investimento",

        type:
            data.type || "Renda Fixa",

        indexer:
            data.indexer || "CDI",

        rate:
            number(data.rate),

        liquidity:
            data.liquidity || "Diária",

        date:
            data.date || "",

        invested:
            number(data.invested),

        current:
            number(data.current || data.invested),

        income:
            number(data.income),

        ir:
            number(data.ir),

        iof:
            number(data.iof),

        maturity:
            data.maturity || "",

        notes:
            data.notes || ""

    });


    saveInvestments();

    renderEverything();

    showToast(
        "Novo investimento adicionado."
    );

};


/* ============================================================
   FUNÇÕES GLOBAIS
============================================================ */

window.deleteInvestment =
    deleteInvestment;


window.openInvestmentModal =
    openInvestmentModal;


window.closeInvestmentModal =
    closeModal;


window.refreshPortfolio =
    renderEverything;


window.exportInvestments =
    exportInvestments;


window.calculateSimulation =
    calculateSimulation;


/* ============================================================
   ATALHOS DE TECLADO
============================================================ */

document.addEventListener(
    "keydown",
    event => {

        /* ESC fecha modal */

        if (
            event.key ===
            "Escape"
        ) {

            closeModal();

        }


        /* CTRL + K abre cadastro */

        if (

            event.ctrlKey &&

            event.key.toLowerCase() === "k"

        ) {

            event.preventDefault();

            openInvestmentModal();

        }

    }

);


/* ============================================================
   DETECTA ALTERAÇÃO ENTRE ABAS
============================================================ */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key ===
            CONFIG.storageKey
        ) {

            investments =
                loadInvestments();

            renderEverything();

        }

    }

);


/* ============================================================
   API INTERNA
============================================================ */

window.InvestPlus = {

    getInvestments() {

        return [...investments];

    },


    getPortfolio() {

        return calculatePortfolio();

    },


    getHealthScore() {

        return calculateHealthScore();

    },


    addInvestment(data) {

        window.addInvestment(data);

    },


    deleteInvestment(id) {

        deleteInvestment(id);

    },


    reset() {

        resetPortfolio();

    },


    export() {

        exportInvestments();

    }

};


/* ============================================================
   FINAL
============================================================ */

console.log(

    "%c INVEST+ COMMAND CENTER ",

    "background:#22d3ee;color:#001018;font-weight:bold;padding:6px 12px;border-radius:5px"

);


console.log(

    "%c Carteira carregada com sucesso.",

    "color:#34d399;font-weight:bold"

);


console.log(

    "Investimentos:",
    investments.length

);


console.log(

    "Patrimônio:",
    formatMoney(
        calculatePortfolio()
            .totalCurrent
    )

);
