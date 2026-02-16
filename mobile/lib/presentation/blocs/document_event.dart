import 'package:equatable/equatable.dart';
import '/data/models/document_model.dart';

abstract class DocumentEvent extends Equatable {
  @override
  List<Object?> get props => [];
}

class FetchDocuments extends DocumentEvent {}

class DownloadDocumentRequested extends DocumentEvent {
  final DocumentModel document;
  DownloadDocumentRequested(this.document);
  @override
  List<Object?> get props => [document];
}
