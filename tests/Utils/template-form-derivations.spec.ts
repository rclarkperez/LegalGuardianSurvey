import { expect, test } from '@playwright/test'
import { deriveTemplateFormData } from '../../src/utils/templateFormDerivations'

test.describe('Template form derivations', () => {
  test('derives estate totals without dollar signs', async () => {
    const derived = deriveTemplateFormData({
      realPropertyWorth1: '4',
      realPropertyWorth2: '3',
      realPropertyWorth3: '3',
      receivableWorth1: '7',
      receivableWorth2: '5',
      receivableWorth3: '3',
      undefined_21: '20',
      undefined_22: '22',
      undefined_23: '30',
      undefined_24: '33',
      undefined_25: '40',
      undefined_26: '44',
      undefined_29: '50',
      undefined_30: '55',
      undefined_31: '60',
      undefined_32: '66',
      undefined_33: '70',
      undefined_34: '77',
      undefined_37: '80',
      undefined_38: '88',
      undefined_39: '90',
      undefined_40: '99',
      undefined_43: '5',
      undefined_44: '6',
      undefined_45: '7',
      undefined_46: '8',
      undefined_47: '9',
      undefined_48: '10',
      undefined_49: '11',
      undefined_50: '12',
      undefined_53: '100',
      fill_10: '75',
      fill_12: '15',
      fill_14: '20',
      fill_16: '25',
      fill_18: '30',
      fill_20: '35',
      fill_22: '40',
      fill_24: '50',
      fill_26: '60',
      fill_28: '70',
      fill_29: '80',
      fill_31: '90',
      fill_33: '100',
      fill_35: '110',
      fill_37: '120',
      undefined_60: '150',
      undefined_67: '100',
      undefined_68: '110',
      undefined_69: '200',
      undefined_70: '220',
      undefined_71: '300',
      undefined_72: '330',
      undefined_73: '400',
      undefined_74: '440',
      undefined_75: '500',
      undefined_76: '550',
      undefined_77: '600',
      undefined_78: '660',
      undefined_79: '700',
      undefined_80: '770'
    })

    expect(derived.realPropertyOtherValue).toBe('10.00')
    expect(derived.receivableOtherValue).toBe('15.00')
    expect(derived.realPropertyWorth1StartDisplay).toBe('4.00')
    expect(derived.realPropertyWorth1EndDisplay).toBe('4.00')
    expect(derived.realPropertyWorth2StartDisplay).toBe('3.00')
    expect(derived.realPropertyWorth2EndDisplay).toBe('3.00')
    expect(derived.realPropertyWorth3StartDisplay).toBe('3.00')
    expect(derived.realPropertyWorth3EndDisplay).toBe('3.00')
    expect(derived.receivableWorth1StartDisplay).toBe('7.00')
    expect(derived.receivableWorth1EndDisplay).toBe('7.00')
    expect(derived.receivableWorth2StartDisplay).toBe('5.00')
    expect(derived.receivableWorth2EndDisplay).toBe('5.00')
    expect(derived.receivableWorth3StartDisplay).toBe('3.00')
    expect(derived.receivableWorth3EndDisplay).toBe('3.00')
    expect(derived.undefined_27).toBe('90.00')
    expect(derived.undefined_28).toBe('99.00')
    expect(derived.undefined_35).toBe('180.00')
    expect(derived.undefined_36).toBe('198.00')
    expect(derived.undefined_41).toBe('465.00')
    expect(derived.undefined_42).toBe('509.00')
    expect(derived.undefined_51).toBe('32.00')
    expect(derived.undefined_52).toBe('36.00')
    expect(derived.undefined_53).toBe('433.00')
    expect(derived.undefined_54).toBe('473.00')
    expect(derived.estateEstimatedReceiptsTotal).toBe('240.00')
    expect(derived.estateEstimatedDisbursementsTotal).toBe('680.00')
    expect(derived.undefined_55).toBe('433.00')
    expect(derived.undefined_56).toBe('240.00')
    expect(derived.undefined_57).toBe('680.00')
    expect(derived.undefined_58).toBe('157.00')
    expect(derived.undefined_59).toBe('150.00')
    expect(derived.undefined_60).toBe('433.00')
    expect(derived.undefined_61).toBe('240.00')
    expect(derived.undefined_62).toBe('673.00')
    expect(derived.undefined_63).toBe('680.00')
    expect(derived.estateAdjustmentsTotal).toBe('157.00')
    expect(derived.estateWorksheetAfterDisbursements).toBe('-7.00')
    expect(derived.estateWorksheetLine31d).toBe('157.00')
    expect(derived.estateBeginningBalanceSummary).toBe('433.00')
    expect(derived.estateReceiptsTotalSummary).toBe('240.00')
    expect(derived.estateDisbursementsTotalSummary).toBe('680.00')
    expect(derived.estateAdjustmentsTotalSummary).toBe('157.00')
    expect(derived.estateEndingMarketValueSummary).toBe('150.00')
    expect(derived.estateCalculatedEndingBalance).toBe('150.00')
    expect(derived.estateBalanceDifference).toBe('')
    expect(derived.undefined_81).toBe('2800.00')
    expect(derived.undefined_82).toBe('3080.00')
    expect(derived.undefined_83).toBe('36960.00')
    expect(derived.fill_45).toBe('36960.00')
    expect(derived.blockedAccountsTotal).toBe('198.00')
    expect(derived.unblockedAccountsTotal).toBe('99.00')
  })
})
