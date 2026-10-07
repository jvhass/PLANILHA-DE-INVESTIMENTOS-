/* =========================================================
   INVEST+
   PERSONAL WEALTH COMMAND CENTER
========================================================= */

const GOAL = 15000;

const STORAGE_KEY = "invest_plus_portfolio";


/* =========================================================
   DADOS INICIAIS
========================================================= */

const DEFAULT_INVESTMENTS = [

  {
    id: crypto.randomUUID(),
    name: "FOCO - Debênture",
    institution: "FOCO Securitizadora",
    rate: "1,6% a.m.",
    applied: 5000,
    current: 5150.37
  },

  {
    id: crypto.randomUUID(),
    name: "FOCO - Debênture",
    institution: "FOCO Securitizadora",
    rate: "1,6% a.m.",
    applied: 1000,
    current: 1015.46
  },

  {
    id: crypto.randomUUID(),
    name: "Caixinha Turbo",
    institution: "Nubank",
    rate: "115% CDI",
    applied: 1688.25,
    current: 1688.25
  },

  {
    id: crypto.randomUUID(),
    name: "LCI Liquidez 6 meses",
    institution: "Banco Inter",
    rate: "92% CDI",
    applied: 300,
    current: 310.71
  },

  {
    id: crypto.randomUUID(),
    name: "Renda Fixa",
    institution: "Banco Inter",
    rate: "100% CDI",
    applied: 170.34,
    current: 170.34
  }

];


/* =========================================================
   CARTEIRA
========================================================= */

let investments =
  JSON.parse(localStorage.getItem(STORAGE_KEY))
  || DEFAULT_INVESTMENTS;


/* =========================================================
   FORMATAÇÃO
========================================================= */

function money(value) {

  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  ).format(value);

}


function number(value) {

  return new Intl.NumberFormat(
    "pt-BR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  ).format(value);

}


/* =========================================================
   SALVAR
========================================================= */

function save() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(investments)
  );

}


/* =========================================================
   TOTAL
========================================================= */

function getTotals() {

  const applied =
    investments.reduce(
      (sum, item) => sum + Number(item.applied),
      0
    );

  const current =
    investments.reduce(
      (sum, item) => sum + Number(item.current),
      0
    );

  const profit = current - applied;

  const profitPercent =
    applied > 0
      ? (profit / applied) * 100
      : 0;

  return {
    applied,
    current,
    profit,
    profitPercent
  };

}


/* =========================================================
   META
========================================================= */

function updateGoal() {

  const { current } = getTotals();

  const percent =
    Math.min(
      (current / GOAL) * 100,
      100
    );

  const remaining =
    Math.max(
      GOAL - current,
      0
    );


  document.getElementById(
    "goalPercent"
  ).textContent =
    `${number(percent)}%`;


  document.getElementById(
    "goalCurrent"
  ).textContent =
    money(current);


  document.getElementById(
    "goalRemaining"
  ).textContent =
    money(remaining);


  const fill =
    document.getElementById("goalFill");


  /*
    Primeiro começa em 0%.
    Depois o navegador anima até o valor real.
  */

  fill.style.width = "0%";


  requestAnimationFrame(() => {

    setTimeout(() => {

      fill.style.width =
        `${percent}%`;

    }, 150);

  });


  const message =
    document.getElementById("goalMessage");


  if (current >= GOAL) {

    message.innerHTML =
      `🏆 META DE R$ 15.000 CONCLUÍDA!`;

  } else {

    message.innerHTML =
      `🚀 Faltam <strong>${money(remaining)}</strong> para você chegar aos R$ 15.000.`;

  }


  /*
    Página de metas
  */

  const goalsFill =
    document.getElementById("goalFillGoals");

  const goalsCurrent =
    document.getElementById("goalCurrentGoals");


  if (goalsFill) {

    goalsFill.style.width =
      `${percent}%`;

  }


  if (goalsCurrent) {

    goalsCurrent.textContent =
      money(current);

  }

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

  const totals =
    getTotals();


  document.getElementById(
    "totalPatrimony"
  ).textContent =
    money(totals.current);


  document.getElementById(
    "totalProfit"
  ).textContent =
    `${totals.profit >= 0 ? "+" : ""} ${money(totals.profit)}`;


  document.getElementById(
    "investmentCount"
  ).textContent =
    investments.length;


  document.getElementById(
    "profitPercent"
  ).textContent =
    `${number(totals.profitPercent)}%`;


  document.getElementById(
    "liquidityValue"
  ).textContent =
    money(totals.current);


  updateGoal();

}


/* =========================================================
   TABELA
========================================================= */

function renderTable() {

  const bodies = [

    document.getElementById(
      "investmentTableBody"
    ),

    document.getElementById(
      "investmentTableBodyFull"
    )

  ];


  bodies.forEach(body => {

    if (!body) return;

    body.innerHTML = "";


    investments.forEach(item => {

      const profit =
        Number(item.current)
        -
        Number(item.applied);


      const row =
        document.createElement("tr");


      row.innerHTML = `

        <td>
          <strong>
            ${escapeHTML(item.name)}
          </strong>
        </td>

        <td>
          ${escapeHTML(item.institution)}
        </td>

        <td>
          ${escapeHTML(item.rate || "-")}
        </td>

        <td>
          ${money(item.applied)}
        </td>

        <td>
          ${money(item.current)}
        </td>

        <td class="profit">
          ${profit >= 0 ? "+" : ""}
          ${money(profit)}
        </td>

        <td>

          <button
            class="delete-btn"
            data-delete="${item.id}"
            title="Excluir">

            <i class="fa-solid fa-trash"></i>

          </button>

        </td>

      `;


      body.appendChild(row);

    });

  });


  document
    .querySelectorAll("[data-delete]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.delete;

          investments =
            investments.filter(
              item => item.id !== id
            );

          save();

          refresh();

        }
      );

    });

}


/* =========================================================
   GRÁFICO DE DISTRIBUIÇÃO
========================================================= */

let allocationChart = null;


function renderAllocationChart() {

  const canvas =
    document.getElementById(
      "allocationChart"
    );


  if (!canvas) return;


  const grouped = {};


  investments.forEach(item => {

    const key =
      item.name;

    grouped[key] =
      (grouped[key] || 0)
      +
      Number(item.current);

  });


  const labels =
    Object.keys(grouped);


  const values =
    Object.values(grouped);


  if (allocationChart) {

    allocationChart.destroy();

  }


  allocationChart =
    new Chart(
      canvas,
      {

        type: "doughnut",

        data: {

          labels,

          datasets: [

            {

              data: values,

              backgroundColor: [

                "#00e5ff",
                "#8b5cf6",
                "#00ff9d",
                "#ffd166",
                "#ff5577",
                "#3b82f6"

              ],

              borderColor:
                "#0b1018",

              borderWidth: 4

            }

          ]

        },

        options: {

          responsive: true,

          maintainAspectRatio: false,

          plugins: {

            legend: {

              position: "bottom",

              labels: {

                color: "#f5f7fa",

                padding: 15

              }

            },

            tooltip: {

              callbacks: {

                label(context) {

                  return `${context.label}: ${money(context.raw)}`;

                }

              }

            }

          }

        }

      }

    );

}


/* =========================================================
   GRÁFICO DE EVOLUÇÃO
========================================================= */

let evolutionChart = null;


function renderEvolutionChart() {

  const canvas =
    document.getElementById(
      "evolutionChart"
    );


  if (!canvas) return;


  const current =
    getTotals().current;


  const applied =
    getTotals().applied;


  if (evolutionChart) {

    evolutionChart.destroy();

  }


  evolutionChart =
    new Chart(

      canvas,

      {

        type: "line",

        data: {

          labels: [
            "Aplicado",
            "Atual"
          ],

          datasets: [

            {

              label:
                "Patrimônio",

              data: [
                applied,
                current
              ],

              borderColor:
                "#00e5ff",

              backgroundColor:
                "rgba(0,229,255,.1)",

              fill: true,

              tension: .4,

              pointRadius: 5

            }

          ]

        },

        options: {

          responsive: true,

          maintainAspectRatio: false,

          plugins: {

            legend: {

              labels: {

                color: "#f5f7fa"

              }

            }

          },

          scales: {

            x: {

              ticks: {

                color: "#8d99aa"

              },

              grid: {

                color:
                  "rgba(255,255,255,.05)"

              }

            },

            y: {

              ticks: {

                color: "#8d99aa",

                callback(value) {

                  return money(value);

                }

              },

              grid: {

                color:
                  "rgba(255,255,255,.05)"

              }

            }

          }

        }

      }

    );

}


/* =========================================================
   HEALTH SCORE
========================================================= */

function updateHealth() {

  const total =
    getTotals().current;


  let score = 60;


  if (investments.length >= 3)
    score += 10;


  if (total >= 5000)
    score += 10;


  if (total >= 10000)
    score += 10;


  if (getTotals().profit >= 0)
    score += 10;


  score =
    Math.min(score,100);


  document.getElementById(
    "healthScore"
  ).textContent =
    score;

}


/* =========================================================
   INSIGHTS
========================================================= */

function renderInsights() {

  const box =
    document.getElementById(
      "insights"
    );


  if (!box) return;


  const totals =
    getTotals();


  const remaining =
    Math.max(
      GOAL - totals.current,
      0
    );


  box.innerHTML = `

    <div class="insight">
      💰 Seu patrimônio atual é
      <strong>${money(totals.current)}</strong>.
    </div>

    <div class="insight">
      🎯 Você está a
      <strong>${money(remaining)}</strong>
      da meta de R$ 15.000.
    </div>

    <div class="insight">
      📊 Sua carteira possui
      <strong>${investments.length}</strong>
      posições cadastradas.
    </div>

    <div class="insight">
      📈 Resultado atual:
      <strong>${money(totals.profit)}</strong>.
    </div>

  `;

}


/* =========================================================
   MODAL
========================================================= */

function openModal() {

  document
    .getElementById(
      "investmentModal"
    )
    .classList.add("open");

}


function closeModal() {

  document
    .getElementById(
      "investmentModal"
    )
    .classList.remove("open");

}


/* =========================================================
   NOVO INVESTIMENTO
========================================================= */

function setupInvestmentForm() {

  const form =
    document.getElementById(
      "investmentForm"
    );


  if (!form) return;


  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const name =
        document.getElementById(
          "investmentName"
        ).value.trim();


      const institution =
        document.getElementById(
          "investmentInstitution"
        ).value.trim();


      const applied =
        Number(
          document.getElementById(
            "investmentApplied"
          ).value
        );


      const current =
        Number(
          document.getElementById(
            "investmentCurrent"
          ).value
        );


      const rate =
        document.getElementById(
          "investmentRate"
        ).value.trim();


      if (
        !name ||
        !institution ||
        !applied ||
        !current
      ) {

        alert(
          "Preencha todos os campos obrigatórios."
        );

        return;

      }


      investments.push({

        id:
          crypto.randomUUID(),

        name,

        institution,

        rate,

        applied,

        current

      });


      save();

      form.reset();

      closeModal();

      refresh();

    }
  );

}


/* =========================================================
   NAVEGAÇÃO
========================================================= */

function setupNavigation() {

  document
    .querySelectorAll(".nav-item")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const page =
            button.dataset.page;


          document
            .querySelectorAll(".nav-item")
            .forEach(item =>
              item.classList.remove("active")
            );


          button.classList.add("active");


          document
            .querySelectorAll(".page")
            .forEach(section =>
              section.classList.remove("active")
            );


          const target =
            document.getElementById(page);


          if (target)
            target.classList.add("active");

        }
      );

    });

}


/* =========================================================
   BOTÕES
========================================================= */

function setupButtons() {

  document
    .querySelectorAll(
      '[data-action="open-investment"]'
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        openModal
      );

    });


  document
    .querySelectorAll(
      '[data-action="close-modal"]'
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        closeModal
      );

    });


  document
    .getElementById(
      "investmentModal"
    )
    .addEventListener(
      "click",
      event => {

        if (
          event.target.id ===
          "investmentModal"
        ) {

          closeModal();

        }

      }
    );

}


/* =========================================================
   SIMULADOR
========================================================= */

function setupSimulator() {

  const form =
    document.getElementById(
      "simulatorForm"
    );


  if (!form) return;


  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      let amount =
        Number(
          document.getElementById(
            "simInitial"
          ).value
        );


      const monthly =
        Number(
          document.getElementById(
            "simMonthly"
          ).value
        );


      const rate =
        Number(
          document.getElementById(
            "simRate"
          ).value
        ) / 100;


      const months =
        Number(
          document.getElementById(
            "simMonths"
          ).value
        );


      for (
        let i = 0;
        i < months;
        i++
      ) {

        amount =
          amount * (1 + rate)
          +
          monthly;

      }


      document.getElementById(
        "simulatorResult"
      ).innerHTML = `

        <div class="goal-card"
             style="margin-top:20px">

          <p class="eyebrow">
            PROJEÇÃO
          </p>

          <h2>
            ${money(amount)}
          </h2>

          <p style="color:#8d99aa;margin-top:8px">

            Patrimônio estimado após
            ${months} meses.

          </p>

        </div>

      `;

    }
  );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================================
   ATUALIZA TUDO
========================================================= */

function refresh() {

  updateDashboard();

  renderTable();

  renderAllocationChart();

  renderEvolutionChart();

  updateHealth();

  renderInsights();

}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

function init() {

  setupNavigation();

  setupButtons();

  setupInvestmentForm();

  setupSimulator();

  refresh();

}


init();
