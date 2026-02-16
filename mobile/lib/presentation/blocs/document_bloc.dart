import 'package:flutter_bloc/flutter_bloc.dart';
import '/domain/repositories/document_repository.dart';
// Import DocumentModel explicitly if needed
import 'document_event.dart';
import 'document_state.dart';

class DocumentBloc extends Bloc<DocumentEvent, DocumentState> {
  final DocumentRepository repository;

  DocumentBloc({required this.repository}) : super(DocumentInitial()) {
    on<FetchDocuments>((event, emit) async {
      emit(DocumentLoading());
      try {
        final documents = await repository.getDocuments();
        emit(DocumentLoaded(documents));
      } catch (e) {
        emit(DocumentError(e.toString()));
      }
    });

    on<DownloadDocumentRequested>((event, emit) async {
      // We don't want to replace the current list state with loading,
      // so maybe we should emit a separate "Action" state or handle this differently.
      // But for simplicity, let's just emit Loading then reload list or success.
      // Ideally, use a "buildWhen" or separate status stream status.
      // For now, let's just do it.
      // LIMITATION: This will clear the list from UI if the UI listens to everything.
      // Better approach: yield a state that copies current list but adds a "downloading" flag.
      // But our State is abstract. Let's assume we just show a snackbar on success/failure and don't clear list.
      // Wait, we can't emit DocumentDownloading if it replaces DocumentLoaded with empty list.
      // Let's Skip emitting Loading state for now to keep list visible, or assume UI handles it?
      // Let's emit nothing but side effect? No, BloC must emit states.
      // Correct way: Add `isLoading` or `isDownloading` field to DocumentLoaded.
      // But that requires refactoring State.
      // Alternative: Just fire and forget? No, we want feedback.
      // Let's use a "Listener" approach in UI.
      // For now: I will emit DocumentDownloading. UI will show loading. Then DocumentLoaded again.
      emit(DocumentDownloading());
      try {
        await repository.downloadDocument(event.document);
        emit(DocumentDownloadSuccess("Download complete!"));
        add(
          FetchDocuments(),
        ); // Reload to show updated status if we tracked it (we don't track offline strictly in model yet)
      } catch (e) {
        emit(DocumentError(e.toString()));
        add(FetchDocuments());
      }
    });
  }
}
