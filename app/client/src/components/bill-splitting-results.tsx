import { useState, useEffect } from "react";
import { Calculator, Receipt, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type SplitResult } from "@shared/schema";

interface ReceiptData {
  receipt: any;
  splitResults: SplitResult[];
}

const colorClasses = {
  primary: "bg-primary-100 text-primary-700",
  amber: "bg-amber-100 text-amber-700", 
  purple: "bg-purple-100 text-purple-700",
  emerald: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
};

export default function BillSplittingResults() {
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  useEffect(() => {
    const handleReceiptProcessed = (event: CustomEvent) => {
      setReceiptData(event.detail);
    };

    window.addEventListener('receiptProcessed', handleReceiptProcessed as EventListener);
    
    return () => {
      window.removeEventListener('receiptProcessed', handleReceiptProcessed as EventListener);
    };
  }, []);

  const formatDate = (date: string | Date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('nl-NL', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleShare = () => {
    if (!receiptData) return;
    
    let shareText = `Groepsrekening verdeling:\n\n`;
    shareText += `${receiptData.receipt.restaurantName || 'Restaurant'}\n`;
    shareText += `Totaal: €${receiptData.receipt.totalAmount?.toFixed(2) || '0.00'}\n\n`;
    
    receiptData.splitResults.forEach(person => {
      shareText += `${person.userName}: €${person.total.toFixed(2)}\n`;
      person.items.forEach(item => {
        shareText += `  - ${item.description}: €${item.amount.toFixed(2)}\n`;
      });
      shareText += `  - Deel van fooi & BTW: €${person.tipAndTax.toFixed(2)}\n\n`;
    });

    if (navigator.share) {
      navigator.share({
        title: 'Groepsrekening verdeling',
        text: shareText,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      // You could show a toast here
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Calculator className="text-emerald-500 text-lg" />
        <h2 className="text-lg font-semibold text-slate-800">Verdeling</h2>
      </div>

      {!receiptData ? (
        /* Before receipt processing */
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="text-slate-400 text-xl" />
          </div>
          <p className="text-slate-600 font-medium">Upload een bon om te beginnen</p>
          <p className="text-sm text-slate-500 mt-1">We verdelen automatisch de kosten op basis van je bestellingen</p>
        </div>
      ) : (
        /* After receipt processing */
        <div className="space-y-4">
          {/* Receipt Info */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-slate-800">
                  {receiptData.receipt.restaurantName || 'Restaurant'}
                </h3>
                <p className="text-sm text-slate-600">
                  {receiptData.receipt.receiptDate ? formatDate(receiptData.receipt.receiptDate) : 'Datum onbekend'}
                </p>
              </div>
              <span className="text-lg font-bold text-slate-800">
                €{receiptData.receipt.totalAmount?.toFixed(2) || '0.00'}
              </span>
            </div>
            
            {/* Accuracy Indicator */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  (receiptData.receipt.accuracy || 0) > 0.8 ? 'bg-emerald-500' : 
                  (receiptData.receipt.accuracy || 0) > 0.6 ? 'bg-amber-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-xs font-medium ${
                  (receiptData.receipt.accuracy || 0) > 0.8 ? 'text-emerald-700' : 
                  (receiptData.receipt.accuracy || 0) > 0.6 ? 'text-amber-700' : 'text-red-700'
                }`}>
                  {Math.round((receiptData.receipt.accuracy || 0) * 100)}% nauwkeurig
                </span>
              </div>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">
                {receiptData.receipt.items?.length || 0} items herkend
              </span>
            </div>
          </div>

          {/* Individual Splits */}
          {receiptData.splitResults.map((person, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    colorClasses[person.userColor as keyof typeof colorClasses] || colorClasses.primary
                  }`}>
                    <span className="font-semibold">{person.userInitial}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800">{person.userName}</h4>
                    <p className="text-sm text-slate-600">{person.items.length} items</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-800">€{person.total.toFixed(2)}</div>
                  <div className="text-xs text-slate-500">incl. deel van fooi</div>
                </div>
              </div>
              
              <div className="space-y-1">
                {person.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.description}</span>
                    <span className="text-slate-800">€{item.amount.toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm pt-1 border-t border-slate-100">
                  <span className="text-slate-600">Deel van fooi & BTW</span>
                  <span className="text-slate-800">€{person.tipAndTax.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-slate-100">
            <Button 
              onClick={handleShare}
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              <Share2 className="mr-2" size={16} />
              Delen
            </Button>
            <Button 
              variant="outline"
              className="px-4 py-3 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Download size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
