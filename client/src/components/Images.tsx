import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader
} from 'semantic-ui-react'

import { createImage, deleteImage, getImages, getUploadUrl, uploadFile } from '../api/images-api'
import Auth from '../auth/Auth'
import { ImageItem } from '../types/ImageItem'

enum UploadState {
  NoUpload,
  UploadingFile
}

interface ImagesProps {
  auth: Auth
  history: History
}

interface ImagesState {
  images: ImageItem[]
  loadingImages: boolean
  file: any
  name: string
  watermark: string
  uploadState: UploadState
}

export class Images extends React.PureComponent<ImagesProps, ImagesState> {
  state: ImagesState = {
    images: [],
    loadingImages: true,
    file: undefined,
    name: '',
    watermark: '',
    uploadState: UploadState.NoUpload
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ name: event.target.value })
  }

  handleWatermarkChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ watermark: event.target.value })
  }

  handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    this.setState({
      file: files[0],
      name: files[0].name
    })
  }

  handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault()
  }

  setUploadState(uploadState: UploadState) {
    this.setState({
      uploadState
    })
  }

  onImageCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      if (!this.state.file) {
        alert('File should be selected')
        return
      }

      const newImage = await createImage(this.props.auth.getIdToken(), {
        name: this.state.name,
        watermark: this.state.watermark
      })

      const uploadUrl = await getUploadUrl(this.props.auth.getIdToken(), newImage.id, newImage.watermark);

      this.setUploadState(UploadState.UploadingFile)
      await uploadFile(uploadUrl, this.state.file)

      this.setState({
        images: [...this.state.images, newImage]
      })
    } catch {
      alert('Image item creation failed')
    } finally {
      this.setUploadState(UploadState.NoUpload)
    }
  }

  onImageDelete = async (imageId: string) => {
    try {
      await deleteImage(this.props.auth.getIdToken(), imageId)
      this.setState({
        images: this.state.images.filter(image => image.id != imageId)
      })
    } catch {
      alert('Image item deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const images = await getImages(this.props.auth.getIdToken())
      this.setState({
        images,
        loadingImages: false
      })
    } catch (e) {
      alert(`Failed to fetch images: ${e.message}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">Images</Header>

        {this.renderCreateImageInput()}

        {this.renderImages()}

        {this.renderUploadImage()}
      </div>
    )
  }

  renderCreateImageInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            disabled
            fluid
            placeholder="image name..."
            onChange={this.handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>

        </Grid.Column>
      </Grid.Row>
    )
  }

  renderUploadImage() {
    return (
      <div>
        <h1>Upload new image</h1>
        <label>File</label>
        <input
          type="file"
          accept="image/*"
          placeholder="Image to upload"
          onChange={this.handleFileChange}
        />
        <input
          hidden
          onChange={this.handleNameChange}
        />
        <label>Watermark Text</label>
        <input
          placeholder="watermark..."
          onChange={this.handleWatermarkChange}
        />
        {this.renderCreateImageButton()}
      </div>
    )
  }

  renderCreateImageButton() {
    return (
      <div>
        {this.state.uploadState === UploadState.UploadingFile && <p>Uploading file</p>}
        <Button
          loading={this.state.uploadState !== UploadState.NoUpload}
          type="submit"
          onClick={() => this.onImageCreate}
        >
          Save
        </Button>
      </div>
    )
  }

  renderImages() {
    if (this.state.loadingImages) {
      return this.renderLoading()
    }

    return this.renderImageList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading Images
        </Loader>
      </Grid.Row>
    )
  }

  renderImageList() {
    return (
      <Grid padded>
        {this.state.images.map((image, pos) => {
          return (
            <Grid.Row key={image.id}>
              <Grid.Column width={10} verticalAlign="middle">
                {image.id}
              </Grid.Column>
              <Grid.Column width={3} floated="right">
                {image.processedDate}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onImageDelete(image.id)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              {image.uploadUrl && (
                <Image src={image.uploadUrl} size="small" wrapped />
              )}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }
}
