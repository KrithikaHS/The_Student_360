import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { CheckCircle, Clock, ExternalLink, FileText, Shield, XCircle } from "lucide-react";

export default function DocumentsList({ documents }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const sortedDocs = [...documents].sort((a, b) => 
    new Date(b.created_date) - new Date(a.created_date)
  );

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
        <CardTitle className="text-xl font-bold text-gray-900">My Documents</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {sortedDocs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg mb-2">No documents uploaded yet</p>
            <p className="text-sm">Start by uploading your academic documents</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedDocs.map((doc) => (
              <div key={doc.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {doc.document_type.replace('_', ' ')}
                        </h3>
                        {doc.blockchain_status === 'on_chain' && (
                          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                            <Shield className="w-3 h-3 mr-1" />
                            On-Chain
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-3">
                        Uploaded on {format(new Date(doc.created_date), 'MMM d, yyyy')}
                      </p>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`${getStatusColor(doc.verification_status)} border flex items-center gap-1`}>
                          {getStatusIcon(doc.verification_status)}
                          {doc.verification_status}
                        </Badge>
                        {doc.verified_by && (
                          <span className="text-xs text-gray-500">
                            Verified by {doc.verified_by}
                          </span>
                        )}
                      </div>
                      {doc.rejection_reason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800">
                            <strong>Rejection Reason:</strong> {doc.rejection_reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {doc.file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}