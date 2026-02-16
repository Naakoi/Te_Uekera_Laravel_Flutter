import '/data/models/document_model.dart';

abstract class DocumentRepository {
  Future<List<DocumentModel>> getDocuments();
  Future<DocumentModel> getDocumentById(int id);
  Future<void> downloadDocument(DocumentModel document);
}
