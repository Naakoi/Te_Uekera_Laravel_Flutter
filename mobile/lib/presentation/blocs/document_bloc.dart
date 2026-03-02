import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mobile/data/repositories/document_repository_impl.dart';
import 'document_event.dart';
import 'document_state.dart';

class DocumentBloc extends Bloc<DocumentEvent, DocumentState> {
  final DocumentRepositoryImpl repository;

  DocumentBloc({required this.repository}) : super(DocumentInitial()) {
    on<FetchDocuments>((event, emit) async {
      emit(DocumentLoading());
      try {
        final documents = await repository.getDocuments();
        emit(DocumentLoaded(documents, isOffline: false));
      } catch (e) {
        // Network unavailable — try SQLite cache
        try {
          final cachedDocuments = await repository.getCachedDocuments();
          if (cachedDocuments.isNotEmpty) {
            emit(DocumentLoaded(cachedDocuments, isOffline: true));
          } else {
            emit(DocumentError(e.toString()));
          }
        } catch (_) {
          emit(DocumentError(e.toString()));
        }
      }
    });

    on<DownloadDocumentRequested>((event, emit) async {
      emit(DocumentDownloading());
      try {
        await repository.downloadDocument(event.document);
        emit(
          DocumentDownloadSuccess('Download complete! Ready for offline use.'),
        );
        add(FetchDocuments()); // Reload so isDownloaded reflects in the UI
      } catch (e) {
        emit(DocumentError(e.toString()));
        add(FetchDocuments());
      }
    });
  }
}
