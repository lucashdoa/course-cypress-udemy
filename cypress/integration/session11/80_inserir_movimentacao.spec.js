/// <reference types="cypress" />
/**
*/

import {LOGIN, MENU, CONTAS, MESSAGE, MOVIMENTACAO, EXTRATO, SALDO} from '../../support/locators'
import '../../support/commandsContas'
import '../../support/buildEnv'
import buildEnv from '../../support/buildEnv'
  
describe('Should test Front-end only', () => {
  beforeEach(() => {
    buildEnv()
    cy.login('lucasteste@mail.com','1')
  })
  after(() => {
    // cy.resetApp()
  })
  
  it('Should create an account', () => {
    cy.intercept('POST','/contas', {
        body: {
            id: 3,
            nome: 'Conta de teste',
            visivel: true,
            usuario_id: 1
        }
    })
    cy.acessarMenuConta()
    cy.intercept('GET', '/contas', {
        body: [
            {
                id: 1,
                nome: "Carteira",
                visivel: true,
                usuario_id: 1,
            },
            {
                id: 2,
                nome: 'Banco',
                visivel: true,
                usuario_id: 1
            },
            {
                id: 3,
                nome: 'coco',
                visivel: true,
                usuario_id: 1
            }
        ]
    }).as('saveConta')
    cy.inserirConta('Conta de teste')
    cy.get(MESSAGE).should('contain', 'Conta inserida com sucesso')
  })
  
  it('Should update an account', () => {
    cy.server()
    cy.route({
      method: 'PUT',
      url: '/contas/**',
      response: {
        id: 1,
        nome: 'Conta alterada',
        visivel: true
      }
    })

    cy.acessarMenuConta()
    cy.xpath(CONTAS.FN_XP_BTN_ALTERAR('Conta para alterar')).click()
    cy.get(CONTAS.NOME)
    .clear()  
    .type('Conta alterada')
    cy.get(CONTAS.BTN_SALVAR).click()
    cy.get(MESSAGE).should('contain', 'Conta atualizada com sucesso')
  })
  
  it('Should not create an account with same name', () => {
    cy.intercept('POST', '/contas', {
      body: [
          {
            error: 'Já existe uma conta com esse nome!',
          },
      ],
      statusCode: 400
    }).as('saveContaMesmoNome')
    cy.acessarMenuConta()
    cy.inserirConta('Conta mesmo nome')
    cy.get(MESSAGE).should('contain', '400')
  })
  
  it.only('Should create a transaction', () => {
    cy.intercept('POST', '/transacoes', {
      body: [
        {
          conta_id: 3321,
          data_pagamento: Cypress.moment().add({days: 1}).format('DD/MM/YYYY'),
          data_transacao: Cypress.moment().format('DD/MM/YYYY'),
          descricao: 'desc',
          envolvido: 'inter',
          status: true,
          tipo: 'REC',
          valor: '123'
        }
      ],
    })
    cy.server()
    cy.route({
      method: 'GET',
      url: '/extrato/**',
      response: [
        {"conta":"Conta para movimentacoes","id":558780,"descricao":"Movimentacao para exclusao","envolvido":"AAA","observacao":null,"tipo":"DESP","data_transacao":"2021-05-22T03:00:00.000Z","data_pagamento":"2021-05-22T03:00:00.000Z","valor":"-1500.00","status":true,"conta_id":603606,"usuario_id":21255,"transferencia_id":null,"parcelamento_id":null},
        {"conta":"Conta com movimentacao","id":558781,"descricao":"Movimentacao de conta","envolvido":"BBB","observacao":null,"tipo":"DESP","data_transacao":"2021-05-22T03:00:00.000Z","data_pagamento":"2021-05-22T03:00:00.000Z","valor":"-1500.00","status":true,"conta_id":603607,"usuario_id":21255,"transferencia_id":null,"parcelamento_id":null},
        {"conta":"Conta para saldo","id":558782,"descricao":"Movimentacao 1, calculo saldo","envolvido":"CCC","observacao":null,"tipo":"REC","data_transacao":"2021-05-22T03:00:00.000Z","data_pagamento":"2021-05-22T03:00:00.000Z","valor":"3500.00","status":false,"conta_id":603608,"usuario_id":21255,"transferencia_id":null,"parcelamento_id":null},
        {"conta":"Conta para saldo","id":558783,"descricao":"Movimentacao 2, calculo saldo","envolvido":"DDD","observacao":null,"tipo":"DESP","data_transacao":"2021-05-22T03:00:00.000Z","data_pagamento":"2021-05-22T03:00:00.000Z","valor":"-1000.00","status":true,"conta_id":603608,"usuario_id":21255,"transferencia_id":null,"parcelamento_id":null},
        {"conta":"Conta para saldo","id":558784,"descricao":"Movimentacao 3, calculo saldo","envolvido":"EEE","observacao":null,"tipo":"REC","data_transacao":"2021-05-22T03:00:00.000Z","data_pagamento":"2021-05-22T03:00:00.000Z","valor":"1534.00","status":true,"conta_id":603608,"usuario_id":21255,"transferencia_id":null,"parcelamento_id":null},
        {"conta":"Conta para extrato","id":558785,"descricao":"Movimentacao para extrato","envolvido":"FFF","observacao":null,"tipo":"DESP","data_transacao":"2021-05-22T03:00:00.000Z","data_pagamento":"2021-05-22T03:00:00.000Z","valor":"-220.00","status":true,"conta_id":603609,"usuario_id":21255,"transferencia_id":null,"parcelamento_id":null},
        {"conta":"Desc","id":552285,"descricao":"Desc","envolvido":"FFF","observacao":null,"tipo":"DESP","data_transacao":"2021-05-22T03:00:00.000Z","data_pagamento":"2021-05-22T03:00:00.000Z","valor":"123.00","status":true,"conta_id":603609,"usuario_id":21255,"transferencia_id":null,"parcelamento_id":null},
      ]
    }).as('extratoAtualizado')
    cy.get(MENU.MOVIMENTACAO).click()
    cy.get(MOVIMENTACAO.DESCRICAO).type('Desc')
    cy.get(MOVIMENTACAO.VALOR).type('123')
    cy.get(MOVIMENTACAO.INTERESSADO).type('Inter')
    cy.get(MOVIMENTACAO.CONTA).select('Conta para alterar')
    cy.get(MOVIMENTACAO.STATUS).click()
    cy.get(MOVIMENTACAO.BTN_SALVAR).click()
    cy.get(MESSAGE).should('contain', 'sucesso')
    cy.get(EXTRATO.NUM_LINHAS).should('have.length', 7)
    cy.xpath(EXTRATO.XP_BUSCA_ELEMENTO).should('exist')
  })
  
  it('Should get balance', () => {
    cy.get(MENU.HOME).click()
    cy.xpath(SALDO.FN_XP_SALDO_CONTA('Conta alterada')).should('contain', '123,00')
  })
  
  it('Should remove a transaction', () => {
    cy.get(MENU.EXTRATO).click()
    cy.xpath(EXTRATO.FN_XP_REMOVER_ELEMENTO('Conta alterada')).click()
    cy.get(MESSAGE).should('contain', 'sucesso')
  })
  
})
