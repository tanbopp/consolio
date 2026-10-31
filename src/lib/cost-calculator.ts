/**
 * Rumus transparan & deterministik untuk pembagian biaya pickup bersama (GroupPickup)
 * tanpa AI/ML — murni berbasis proporsi berat paket masing-masing penjual.
 *
 * Contoh rumus sesuai spesifikasi:
 * biaya_penjual = (berat_penjual / total_berat) * biaya_pickup * (1 + fee_platform)
 *
 * Aturan Pembulatan:
 * - Pembulatan ke rupiah terdekat (Math.round).
 * - Total pembagian tidak boleh melebihi total biaya pickup + fee karena pembulatan.
 * - Selisih pembulatan (roundingDifference) dihitung secara eksplisit dan ditampilkan
 *   serta diberikan/dialokasikan ke penyesuaian akhir agar total tagihan akurat 100%.
 */

export interface SellerWeightInput {
  sellerId: string;
  sellerName: string;
  storeName?: string | null;
  weightGram: number;
  packageCount: number;
  draftIds: string[];
}

export interface SellerCostAllocation {
  sellerId: string;
  sellerName: string;
  storeName?: string | null;
  weightGram: number;
  packageCount: number;
  weightPercentage: number; // 0 - 100 (misal 20.0)
  costBeforeFee: number; // biaya pickup proporsional sebelum fee (Rp)
  platformFee: number; // fee platform proporsional (Rp)
  rawRoundedTotal: number; // hasil pembulatan awal
  roundingAdjustment: number; // penyesuaian jika total melebihi plafon atau sisa pembulatan
  finalTotalCharge: number; // total tagihan akhir yang harus dibayar penjual (Rp)
  soloCostEstimate: number; // estimasi jika kirim sendiri-sendiri
  estimatedSavings: number; // penghematan dibandingkan kirim sendiri
  draftIds: string[];
}

export interface GroupCostCalculationResult {
  basePickupFee: number;
  platformFeePercent: number;
  totalPlatformFee: number;
  exactTotalCeiling: number; // basePickupFee + totalPlatformFee
  totalWeightGram: number;
  totalPackages: number;
  sumOfSellerCharges: number;
  roundingDiscrepancy: number; // selisih pembulatan (positif = sisa pembulatan untuk admin cluster, negatif = dikoreksi)
  allocations: SellerCostAllocation[];
}

export function calculateGroupPickupCosts(params: {
  basePickupFee: number;
  platformFeePercent: number; // contoh: 10 untuk 10%
  sellers: SellerWeightInput[];
  soloPickupReferenceFee?: number;
}): GroupCostCalculationResult {
  const {
    basePickupFee,
    platformFeePercent,
    sellers,
    soloPickupReferenceFee = basePickupFee,
  } = params;

  const totalPlatformFee = Math.round(basePickupFee * (platformFeePercent / 100));
  const exactTotalCeiling = basePickupFee + totalPlatformFee;

  const totalWeightGram = sellers.reduce((sum, s) => sum + s.weightGram, 0);
  const totalPackages = sellers.reduce((sum, s) => sum + s.packageCount, 0);

  if (totalWeightGram <= 0 || sellers.length === 0) {
    return {
      basePickupFee,
      platformFeePercent,
      totalPlatformFee,
      exactTotalCeiling,
      totalWeightGram: 0,
      totalPackages: 0,
      sumOfSellerCharges: 0,
      roundingDiscrepancy: 0,
      allocations: [],
    };
  }

  const feeMultiplier = 1 + platformFeePercent / 100;

  // Tahap 1: Hitung bagian masing-masing penjual dengan pembulatan ke rupiah terdekat
  const allocations: SellerCostAllocation[] = sellers.map((seller) => {
    const proportion = seller.weightGram / totalWeightGram;
    const weightPercentage = Number((proportion * 100).toFixed(2));

    const exactCostBeforeFee = proportion * basePickupFee;
    const exactTotal = proportion * basePickupFee * feeMultiplier;

    const costBeforeFee = Math.round(exactCostBeforeFee);
    const rawRoundedTotal = Math.round(exactTotal);
    const platformFee = rawRoundedTotal - costBeforeFee;

    const soloCostEstimate = soloPickupReferenceFee;
    const estimatedSavings = Math.max(0, soloCostEstimate - rawRoundedTotal);

    return {
      sellerId: seller.sellerId,
      sellerName: seller.sellerName,
      storeName: seller.storeName,
      weightGram: seller.weightGram,
      packageCount: seller.packageCount,
      weightPercentage,
      costBeforeFee,
      platformFee,
      rawRoundedTotal,
      roundingAdjustment: 0,
      finalTotalCharge: rawRoundedTotal,
      soloCostEstimate,
      estimatedSavings,
      draftIds: seller.draftIds,
    };
  });

  // Tahap 2: Pastikan total pembagian TIDAK melebihi exactTotalCeiling (total biaya pickup + fee) karena pembulatan ke atas
  let currentSum = allocations.reduce((sum, a) => sum + a.finalTotalCharge, 0);

  if (currentSum > exactTotalCeiling) {
    // Jika melebihi plafon karena pembulatan ke atas (misal 3 penjual @ 33.33%),
    // kurangi kelebihan 1 rupiah per penjual mulai dari yang beratnya terbesar
    let excess = currentSum - exactTotalCeiling;
    const sortedIndices = allocations
      .map((_, idx) => idx)
      .sort((a, b) => allocations[b].weightGram - allocations[a].weightGram);

    let i = 0;
    while (excess > 0 && sortedIndices.length > 0) {
      const targetIdx = sortedIndices[i % sortedIndices.length];
      allocations[targetIdx].roundingAdjustment -= 1;
      allocations[targetIdx].finalTotalCharge -= 1;
      allocations[targetIdx].platformFee =
        allocations[targetIdx].finalTotalCharge - allocations[targetIdx].costBeforeFee;
      allocations[targetIdx].estimatedSavings = Math.max(
        0,
        allocations[targetIdx].soloCostEstimate - allocations[targetIdx].finalTotalCharge
      );
      excess -= 1;
      i++;
    }
    currentSum = allocations.reduce((sum, a) => sum + a.finalTotalCharge, 0);
  }

  // Sisa pembulatan (jika currentSum < exactTotalCeiling, misal selisih Rp 1 - Rp 2)
  // ditampilkan sebagai selisih pembulatan / diberikan ke admin cluster sesuai spesifikasi.
  const roundingDiscrepancy = exactTotalCeiling - currentSum;

  return {
    basePickupFee,
    platformFeePercent,
    totalPlatformFee,
    exactTotalCeiling,
    totalWeightGram,
    totalPackages,
    sumOfSellerCharges: currentSum,
    roundingDiscrepancy,
    allocations,
  };
}

