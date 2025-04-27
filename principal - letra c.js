document.addEventListener('DOMContentLoaded', function () {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = iniciar;
    document.head.appendChild(script);

    function iniciar() {
        const container = document.createElement('div');
        container.style.position = 'relative';
        container.style.width = '900px';
        container.style.height = '500px';
        container.style.margin = 'auto';
        document.body.appendChild(container);

        const canvasGrafico = document.createElement('canvas');
        canvasGrafico.id = 'grafico';
        canvasGrafico.width = 900;
        canvasGrafico.height = 500;
        container.appendChild(canvasGrafico);

        const canvasAnimacao = document.createElement('canvas');
        canvasAnimacao.id = 'animacao';
        canvasAnimacao.width = 900;
        canvasAnimacao.height = 500;
        canvasAnimacao.style.position = 'absolute';
        canvasAnimacao.style.top = '0';
        canvasAnimacao.style.left = '0';
        canvasAnimacao.style.pointerEvents = 'none';
        container.appendChild(canvasAnimacao);

        const ctxGrafico = canvasGrafico.getContext('2d');
        const ctxAnimacao = canvasAnimacao.getContext('2d');

        // Constantes do problema
        const m = 1;
        const omega = 1;
        const epsilon = 0.1;
        const q0 = 1;
        const dt = 0.01;
        const Tmax = 60;
        const steps = Math.floor(Tmax / dt);

        const xmin = 0;
        const xmax = Tmax;
        const ymin = -3.5;
        const ymax = 2;

        // Funções S, C1 e D1
        function S0(Q, P, t) {
            return Q * P - omega * P * t;
        }

        function C1(Q, P) {
            return -(3 / 8) * Math.sqrt(P / (2 * m * omega)) * (Math.cos(Q) - (1 / 9) * Math.cos(3 * Q));
        }

        function D1(Q, P, t) {
            return (3 / 4) * Math.sqrt(P / (2 * m * omega)) * (Math.cos(Q) + (1 / 3) * Math.cos(3 * Q)) * t;
        }

        function dC1dP(Q, P) {
            return (3 / 16) * (1 / Math.sqrt(2 * m * omega * P)) * (Math.cos(Q) - (1 / 9) * Math.cos(3 * Q));
        }

        function dD1dP(Q, P, t) {
            return (3 / 8) * (1 / Math.sqrt(2 * m * omega * P)) * (Math.cos(Q) + (1 / 3) * Math.cos(3 * Q)) * t;
        }

        // Integrar q(t) pela Teoria de Perturbação
        function integrarTPC(Q0, P0) {
            const qs = [];
            const ts = [];

            for (let i = 0; i < steps; i++) {
                const t = i * dt;
                const Q_free = Q0 + omega * t;
                const P_free = P0;

                const dW_dP = Q_free - omega * t
                    + epsilon * (dC1dP(Q_free, P_free) + dD1dP(Q_free, P_free, t));

                qs.push(dW_dP);
                ts.push(t);
            }

            return { qs, ts };
        }

        // Condições iniciais
        const condicoesIniciais = [
            { q: 0.2, p: 0 },
            { q: 0.6, p: 0 },
            { q: 1.0, p: 0 },
            { q: 2.0, p: 0 }
        ];

        const trajetorias = condicoesIniciais.map((cond, index) => {
            // Converter (q,p) iniciais para (Q,P)
            const P0 = 0.5 * m * omega * cond.q * cond.q;
            const Q0 = Math.acos(cond.q / q0);

            const resultado = integrarTPC(Q0, P0);
            return {
                label: `q(0)=${cond.q}, p(0)=${cond.p}`,
                data: resultado.qs.map((q, i) => ({ x: resultado.ts[i], y: q })),
                cor: `hsl(${index * 90}, 70%, 50%)`,
                qs: resultado.qs,
                ts: resultado.ts
            };
        });

        const chart = new Chart(ctxGrafico, {
            type: 'line',
            data: {
                datasets: trajetorias.map(traj => ({
                    label: traj.label,
                    data: traj.data,
                    borderColor: traj.cor,
                    fill: false,
                    tension: 0.1,
                    pointRadius: 0,
                    borderWidth: 2
                }))
            },
            options: {
                responsive: false,
                animation: false,
                scales: {
                    x: {
                        type: 'linear',
                        min: xmin,
                        max: xmax,
                        title: { display: true, text: 'Tempo (t)' }
                    },
                    y: {
                        min: ymin,
                        max: ymax,
                        title: { display: true, text: 'q(t)' }
                    }
                },
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });

        const particulas = trajetorias.map(traj => ({
            qs: traj.qs,
            ts: traj.ts,
            cor: traj.cor
        }));

        let tempo = 0;
        const velocidade = 0.2; // controla a velocidade da animação

        function desenharBolinhas() {
            ctxAnimacao.clearRect(0, 0, canvasAnimacao.width, canvasAnimacao.height);

            const escalaX = chart.scales.x;
            const escalaY = chart.scales.y;

            particulas.forEach(p => {
                const i = Math.floor(tempo / dt);
                if (i < p.qs.length) {
                    const tAtual = p.ts[i];
                    const qAtual = p.qs[i];

                    const xCanvas = escalaX.getPixelForValue(tAtual);
                    const yCanvas = escalaY.getPixelForValue(qAtual);

                    ctxAnimacao.beginPath();
                    ctxAnimacao.arc(xCanvas, yCanvas, 8, 0, 2 * Math.PI);
                    ctxAnimacao.fillStyle = p.cor;
                    ctxAnimacao.fill();
                }
            });

            tempo += dt * velocidade;

            if (tempo <= Tmax) {
                requestAnimationFrame(desenharBolinhas);
            }
        }

        // Esperar um pouco para ter certeza que o gráfico está pronto
        setTimeout(() => {
            desenharBolinhas();
        }, 300);
    }
});
