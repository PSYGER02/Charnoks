/**
 * Note Parser - Implements ChatGPT plan for parsing free-text notes into structured operations
 */

export interface ParsedOperations {
  purchases?: Array<{
    product: string;
    bags: number;
    units_per_bag?: number;
  }>;
  productions?: Array<{
    result_product: string;
    bags: number;
    parts_per_bag?: number;
  }>;
  transfers?: Array<{
    to_branch: string;
    bags: number;
    neck_bags?: number;
  }>;
  branch_operations?: Array<{
    branch: string;
    op: 'cook' | 'sale';
    bags?: number;
    parts_sold?: number;
    price_each?: number;
  }>;
  leftovers?: Array<{
    product: string;
    parts: number;
    suggested_price?: number;
  }>;
}

export function parseNoteToOperations(note: string): ParsedOperations {
  const result: ParsedOperations = {};
  const text = note.toLowerCase();

  // Parse purchases
  const purchaseMatch = text.match(/bought?\s+(.+?)\s+(\d+)\s+bags?/);
  if (purchaseMatch) {
    const product = purchaseMatch[1];
    const bags = parseInt(purchaseMatch[2]);
    result.purchases = [{ product, bags }];
  }

  // Parse productions
  const productionMatch = text.match(/(\d+)\s+bags?\s*[×x]\s*(\d+)\s+parts?/);
  if (productionMatch) {
    const bags = parseInt(productionMatch[1]);
    const parts_per_bag = parseInt(productionMatch[2]);
    result.productions = [{ result_product: 'chicken_parts', bags, parts_per_bag }];
  }

  // Parse transfers
  const transferMatch = text.match(/sent?\s+(\d+)\s+bags?.+?to\s+(\w+)/);
  if (transferMatch) {
    const bags = parseInt(transferMatch[1]);
    const to_branch = transferMatch[2];
    result.transfers = [{ to_branch, bags }];
  }

  // Parse cooking operations
  const cookMatch = text.match(/cooked?\s+(\d+)\s+bags?/);
  if (cookMatch) {
    const bags = parseInt(cookMatch[1]);
    result.branch_operations = result.branch_operations || [];
    result.branch_operations.push({ branch: 'Branch1', op: 'cook', bags });
  }

  // Parse sales
  const saleMatch = text.match(/sold?\s+(\d+)\s+(?:pcs?|pieces?)\s*@\s*(\d+)/);
  if (saleMatch) {
    const parts_sold = parseInt(saleMatch[1]);
    const price_each = parseInt(saleMatch[2]);
    result.branch_operations = result.branch_operations || [];
    result.branch_operations.push({ branch: 'Branch1', op: 'sale', parts_sold, price_each });
  }

  return result;
}

export function validateOperations(operations: ParsedOperations): boolean {
  const validKeys = ['purchases', 'productions', 'transfers', 'branch_operations', 'leftovers'];
  return Object.keys(operations).every(key => validKeys.includes(key));
}