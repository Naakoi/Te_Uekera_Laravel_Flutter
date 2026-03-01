import 'package:equatable/equatable.dart';
import '/data/models/document_model.dart';

abstract class DocumentState extends Equatable {
  @override
  List<Object?> get props => [];
}

class DocumentInitial extends DocumentState {}

class DocumentLoading extends DocumentState {}

class DocumentDownloading extends DocumentState {}

class DocumentDownloadSuccess extends DocumentState {
  final String message;
  DocumentDownloadSuccess(this.message);
}

class DocumentLoaded extends DocumentState {
  final List<DocumentModel> documents;
  final bool isOffline;
  DocumentLoaded(this.documents, {this.isOffline = false});
  @override
  List<Object?> get props => [documents, isOffline];
}

class DocumentError extends DocumentState {
  final String message;
  DocumentError(this.message);
  @override
  List<Object?> get props => [message];
}
