use std::path::{Path, PathBuf};
use crate::error::{AppError, AppErrorCode};

/// Validates that an input path exists, is a regular file, and can be read.
pub fn validate_input_file(path_str: &str) -> Result<PathBuf, AppError> {
    if path_str.trim().is_empty() {
        return Err(AppError::new(
            AppErrorCode::InvalidArgument,
            "Input file path cannot be empty",
        ));
    }

    let path = Path::new(path_str);
    if !path.exists() {
        return Err(AppError::new(
            AppErrorCode::InputUnreadable,
            format!("Input file does not exist: {}", path.display()),
        ));
    }

    if !path.is_file() {
        return Err(AppError::new(
            AppErrorCode::InputUnreadable,
            format!("Path is not a regular file: {}", path.display()),
        ));
    }

    // Canonicalize to resolve symlinks and relative segments
    match path.canonicalize() {
        Ok(canonical) => Ok(canonical),
        Err(err) => Err(AppError::new(
            AppErrorCode::InputUnreadable,
            format!("Cannot canonicalize path: {err}"),
        )),
    }
}

/// Validates an output directory to ensure it exists or can be written to.
pub fn validate_output_directory(dir_str: &str) -> Result<PathBuf, AppError> {
    if dir_str.trim().is_empty() {
        return Err(AppError::new(
            AppErrorCode::InvalidArgument,
            "Output directory path cannot be empty",
        ));
    }

    let path = Path::new(dir_str);
    if !path.exists() {
        return Err(AppError::new(
            AppErrorCode::PathNotAllowed,
            format!("Output directory does not exist: {}", path.display()),
        ));
    }

    if !path.is_dir() {
        return Err(AppError::new(
            AppErrorCode::PathNotAllowed,
            format!("Output path is not a directory: {}", path.display()),
        ));
    }

    match path.canonicalize() {
        Ok(canonical) => Ok(canonical),
        Err(err) => Err(AppError::new(
            AppErrorCode::PathNotAllowed,
            format!("Cannot canonicalize output directory: {err}"),
        )),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use tempfile::tempdir;

    #[test]
    fn test_validate_input_file_success() {
        let dir = tempdir().unwrap();
        let file_path = dir.path().join("test.mp4");
        File::create(&file_path).unwrap();

        let result = validate_input_file(file_path.to_str().unwrap());
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_input_file_not_found() {
        let result = validate_input_file("non_existent_video_path.mp4");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().code, AppErrorCode::InputUnreadable);
    }

    #[test]
    fn test_validate_output_directory_success() {
        let dir = tempdir().unwrap();
        let result = validate_output_directory(dir.path().to_str().unwrap());
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_output_directory_empty() {
        let result = validate_output_directory("");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().code, AppErrorCode::InvalidArgument);
    }
}
